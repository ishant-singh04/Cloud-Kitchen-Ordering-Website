import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order, { IOrderItem } from '@/models/Order';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import RestaurantSettings from '@/models/RestaurantSettings';
import User from '@/models/User';
import { getAuthUserFromRequest } from '@/lib/auth';
import { broadcastNewOrder } from '@/lib/socket-emitter';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = getAuthUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const filter: any = {};

    if (auth?.role === 'customer') {
      filter.customerId = auth.userId;
    } else if (auth?.role === 'kitchen') {
      // Kitchen typically focuses on active orders unless requested
      if (status) {
        filter.status = status;
      }
    } else if (auth?.role === 'admin') {
      if (status) {
        filter.status = status;
      }
    } else {
      // Unauthenticated request
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = getAuthUserFromRequest(req);
    const body = await req.json();

    const {
      items,
      deliveryAddress,
      deliveryInstructions,
      couponCode,
      paymentMethod,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.pincode) {
      return NextResponse.json({ success: false, error: 'Valid delivery address is required' }, { status: 400 });
    }

    // 1. Fetch settings for taxes & delivery fee rules
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create({});
    }

    if (settings.isOnlineOrderingEnabled === false) {
      return NextResponse.json(
        { success: false, error: 'Online ordering is currently paused by the restaurant.' },
        { status: 400 }
      );
    }

    if (settings.isKitchenAcceptingOrders === false) {
      return NextResponse.json(
        { success: false, error: 'Kitchen is currently closed and not accepting new orders.' },
        { status: 400 }
      );
    }

    const isCod = paymentMethod === 'cod';
    if (isCod && settings.isCodEnabled === false) {
      return NextResponse.json(
        { success: false, error: 'Cash on delivery is currently disabled.' },
        { status: 400 }
      );
    }

    if (!isCod && settings.isOnlinePaymentEnabled === false) {
      return NextResponse.json(
        { success: false, error: 'Online payment is currently disabled.' },
        { status: 400 }
      );
    }

    // 2. Fetch customer details
    let customerName = 'Guest Customer';
    let customerEmail = 'guest@example.com';
    let customerPhone = deliveryAddress.phone || '+91 98765 00000';
    let customerId = auth?.userId;

    if (auth?.userId) {
      const user = await User.findById(auth.userId);
      if (user) {
        customerName = user.name;
        customerEmail = user.email;
        customerPhone = user.phone;
      }
    } else {
      // If no auth, create or find customer by email/phone or require auth
      return NextResponse.json({ success: false, error: 'Please sign in to place an order' }, { status: 401 });
    }

    // 3. SECURE BACKEND CALCULATION OF ITEMS, PRICES, & SUB-TOTAL
    // Never trust frontend prices!
    let calculatedSubtotal = 0;
    const validatedOrderItems: IOrderItem[] = [];
    let maxPrepTime = 20;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({ success: false, error: `Product not found: ${item.name || item.productId}` }, { status: 400 });
      }

      if (!product.isAvailable || !product.inStock) {
        return NextResponse.json(
          { success: false, error: `"${product.name}" is currently unavailable or out of stock.` },
          { status: 400 }
        );
      }

      if (product.prepTimeMinutes && product.prepTimeMinutes > maxPrepTime) {
        maxPrepTime = product.prepTimeMinutes;
      }

      // Calculate add-on prices from product definition
      const validatedAddOns: { name: string; price: number }[] = [];
      let addOnsTotal = 0;

      if (item.selectedAddOns && Array.isArray(item.selectedAddOns)) {
        for (const selectedAddon of item.selectedAddOns) {
          const matchedAddon = product.addOns.find((a: any) => a.name === selectedAddon.name);
          if (matchedAddon) {
            validatedAddOns.push({ name: matchedAddon.name, price: matchedAddon.price });
            addOnsTotal += matchedAddon.price;
          }
        }
      }

      const itemUnitPrice = product.price + addOnsTotal;
      const quantity = Math.max(1, parseInt(item.quantity || 1, 10));
      const itemTotal = itemUnitPrice * quantity;

      calculatedSubtotal += itemTotal;

      validatedOrderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
        isVeg: product.isVeg,
        image: product.image,
        selectedAddOns: validatedAddOns,
        specialInstructions: item.specialInstructions || '',
        itemTotal,
      });
    }

    // Validate minimum order amount
    if (settings.minOrderAmount && calculatedSubtotal < settings.minOrderAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order amount is ₹${settings.minOrderAmount}. Your current subtotal is ₹${calculatedSubtotal}.`,
        },
        { status: 400 }
      );
    }

    // 4. COUPON VALIDATION & DISCOUNT CALCULATION
    let calculatedDiscount = 0;
    let validCouponCode: string | undefined = undefined;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        isActive: true,
      });

      if (coupon && new Date() <= new Date(coupon.expiryDate)) {
        if (!coupon.minOrderAmount || calculatedSubtotal >= coupon.minOrderAmount) {
          if (!coupon.totalUsageLimit || coupon.usedCount < coupon.totalUsageLimit) {
            if (coupon.discountType === 'percentage') {
              calculatedDiscount = (calculatedSubtotal * coupon.discountValue) / 100;
              if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
                calculatedDiscount = coupon.maxDiscountAmount;
              }
            } else {
              calculatedDiscount = coupon.discountValue;
            }

            calculatedDiscount = Math.min(calculatedDiscount, calculatedSubtotal);
            calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;
            validCouponCode = coupon.code;

            // Increment coupon used count
            await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
          }
        }
      }
    }

    // 5. TAX & DELIVERY FEE
    const discountedSubtotal = Math.max(0, calculatedSubtotal - calculatedDiscount);
    const taxRate = settings.taxRatePercentage || 5;
    const calculatedTax = Math.round(((discountedSubtotal * taxRate) / 100) * 100) / 100;

    let deliveryFee = settings.deliveryFee || 40;
    if (settings.minOrderForFreeDelivery && calculatedSubtotal >= settings.minOrderForFreeDelivery) {
      deliveryFee = 0;
    }

    const calculatedTotalAmount = Math.round((discountedSubtotal + calculatedTax + deliveryFee) * 100) / 100;

    // 6. GENERATE UNIQUE ORDER NUMBER & DELIVERY OTP
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const orderNumber = `CKP-${datePrefix}-${randomSuffix}`;
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // 7. INITIAL ORDER STATUS & PAYMENT STATUS
    const initialStatus = 'PENDING';
    const initialPaymentStatus = isCod ? 'pending' : (razorpayPaymentId ? 'completed' : 'pending');

    const newOrder = await Order.create({
      orderNumber,
      deliveryOtp,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress: {
        label: deliveryAddress.label || 'Home',
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state || 'Karnataka',
        pincode: deliveryAddress.pincode,
        landmark: deliveryAddress.landmark || '',
      },
      deliveryInstructions: deliveryInstructions || '',
      items: validatedOrderItems,
      subtotal: calculatedSubtotal,
      discount: calculatedDiscount,
      couponCode: validCouponCode,
      tax: calculatedTax,
      deliveryFee,
      totalAmount: calculatedTotalAmount,
      paymentMethod: isCod ? 'cod' : 'razorpay',
      paymentStatus: initialPaymentStatus,
      razorpayOrderId: razorpayOrderId || undefined,
      razorpayPaymentId: razorpayPaymentId || undefined,
      razorpaySignature: razorpaySignature || undefined,
      status: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          timestamp: new Date(),
          note: isCod ? 'Order placed via Cash on Delivery' : 'Order placed and paid online',
          updatedBy: 'Customer',
        },
      ],
      estimatedPrepTimeMinutes: maxPrepTime,
    });

    // 8. REAL-TIME SOCKET NOTIFICATION
    broadcastNewOrder(newOrder);

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: newOrder,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to place order' }, { status: 500 });
  }
}
