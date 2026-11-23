import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order, { OrderStatus } from '@/models/Order';
import Product from '@/models/Product';
import Ingredient from '@/models/Ingredient';
import InventoryTransaction from '@/models/InventoryTransaction';
import { getAuthUserFromRequest } from '@/lib/auth';
import { broadcastOrderStatusChange } from '@/lib/socket-emitter';

const VALID_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'REJECTED',
  'CANCELLED',
  'REFUNDED',
];

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'kitchen')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Kitchen or Admin required' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { status, note, estimatedPrepTimeMinutes } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const previousStatus = order.status;

    // Prevent transitions if already delivered/cancelled/rejected
    if (['DELIVERED', 'CANCELLED', 'REJECTED'].includes(previousStatus)) {
      return NextResponse.json(
        { success: false, error: `Order is already ${previousStatus} and cannot be altered.` },
        { status: 400 }
      );
    }

    // Update status and append to history
    order.status = status;
    if (estimatedPrepTimeMinutes) {
      order.estimatedPrepTimeMinutes = estimatedPrepTimeMinutes;
    }

    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status transitioned from ${previousStatus} to ${status}`,
      updatedBy: `${auth.name} (${auth.role})`,
    });

    // If order was COD and is now DELIVERED, mark payment completed
    if (order.paymentMethod === 'cod' && status === 'DELIVERED') {
      order.paymentStatus = 'completed';
    }

    // INVENTORY DEDUCTION ON CONFIRMATION / PREPARATION
    // Deduct ingredient quantities when first transitioning to CONFIRMED or PREPARING
    if (
      (status === 'CONFIRMED' || status === 'PREPARING') &&
      previousStatus === 'PENDING'
    ) {
      for (const item of order.items) {
        try {
          const product = await Product.findById(item.productId);
          if (product && product.ingredientsNeeded && product.ingredientsNeeded.length > 0) {
            for (const ingReq of product.ingredientsNeeded) {
              const totalQuantityToDeduct = ingReq.quantityRequired * item.quantity;
              const ingredient = await Ingredient.findById(ingReq.ingredientId);
              if (ingredient) {
                const prev = ingredient.currentStock;
                const nextStock = Math.max(0, prev - totalQuantityToDeduct);
                ingredient.currentStock = Math.round(nextStock * 100) / 100;
                await ingredient.save();

                await InventoryTransaction.create({
                  ingredientId: ingredient._id,
                  ingredientName: ingredient.name,
                  changeType: 'deduction',
                  quantity: -totalQuantityToDeduct,
                  previousStock: prev,
                  newStock: ingredient.currentStock,
                  unit: ingredient.unit,
                  orderId: order._id,
                  notes: `Auto deduction for ${item.quantity}x ${item.name}`,
                  performedBy: 'System / Order Processing',
                });
              }
            }
          }
        } catch (invErr) {
          console.error('Inventory deduction non-fatal error:', invErr);
        }
      }
    }

    // INVENTORY RESTORATION ON CANCELLATION / REJECTION
    if (
      (status === 'CANCELLED' || status === 'REJECTED') &&
      ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'].includes(previousStatus)
    ) {
      for (const item of order.items) {
        try {
          const product = await Product.findById(item.productId);
          if (product && product.ingredientsNeeded && product.ingredientsNeeded.length > 0) {
            for (const ingReq of product.ingredientsNeeded) {
              const totalQuantityToRestore = ingReq.quantityRequired * item.quantity;
              const ingredient = await Ingredient.findById(ingReq.ingredientId);
              if (ingredient) {
                const prev = ingredient.currentStock;
                ingredient.currentStock = Math.round((prev + totalQuantityToRestore) * 100) / 100;
                await ingredient.save();

                await InventoryTransaction.create({
                  ingredientId: ingredient._id,
                  ingredientName: ingredient.name,
                  changeType: 'restoration',
                  quantity: totalQuantityToRestore,
                  previousStock: prev,
                  newStock: ingredient.currentStock,
                  unit: ingredient.unit,
                  orderId: order._id,
                  notes: `Restored stock due to order ${status.toLowerCase()}`,
                  performedBy: `${auth.name} (${auth.role})`,
                });
              }
            }
          }
        } catch (invErr) {
          console.error('Inventory restoration error:', invErr);
        }
      }

      // Handle refund for paid online orders
      if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'completed') {
        order.paymentStatus = 'refunded';
        order.statusHistory.push({
          status: 'REFUNDED',
          timestamp: new Date(),
          note: 'Online payment marked for refund upon order cancellation',
          updatedBy: `${auth.name} (${auth.role})`,
        });
      }
    }

    await order.save();

    // REAL-TIME BROADCAST TO CUSTOMER, KITCHEN, AND ADMIN DASHBOARDS
    broadcastOrderStatusChange(order);

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update order status' }, { status: 500 });
  }
}
