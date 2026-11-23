import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Ingredient from '@/models/Ingredient';
import Coupon from '@/models/Coupon';
import Order from '@/models/Order';
import RestaurantSettings from '@/models/RestaurantSettings';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    await connectToDatabase();

    // Check if already seeded
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      // Clear or refresh
      await Promise.all([
        User.deleteMany({}),
        Category.deleteMany({}),
        Product.deleteMany({}),
        Ingredient.deleteMany({}),
        Coupon.deleteMany({}),
        Order.deleteMany({}),
        RestaurantSettings.deleteMany({}),
      ]);
    }

    // 1. Settings
    await RestaurantSettings.create({
      name: 'CloudKitchen Pro',
      tagline: 'Artisanal Flavors, Delivered Hot & Fresh',
      description: 'Premier multi-brand cloud kitchen delivering chef-curated gourmet meals, woodfired pizzas, and handcrafted desserts.',
      phone: '+91 98765 43210',
      email: 'hello@cloudkitchenpro.com',
      address: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
      openingTime: '10:00 AM',
      closingTime: '11:45 PM',
      deliveryFee: 40,
      minOrderForFreeDelivery: 499,
      taxRatePercentage: 5,
      isKitchenAcceptingOrders: true,
      estimatedDeliveryTimeMinutes: 30,
      currencySymbol: '₹',
    });

    // 2. Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const kitchenPassword = await bcrypt.hash('Kitchen@123', salt);
    const customerPassword = await bcrypt.hash('Customer@123', salt);

    const [adminUser, kitchenUser, customerUser] = await Promise.all([
      User.create({
        name: 'Vikram Mehta (Admin)',
        email: 'admin@cloudkitchen.com',
        password: adminPassword,
        phone: '+91 98000 11111',
        role: 'admin',
      }),
      User.create({
        name: 'Chef Rajesh Sharma (Head Chef)',
        email: 'kitchen@cloudkitchen.com',
        password: kitchenPassword,
        phone: '+91 98000 22222',
        role: 'kitchen',
      }),
      User.create({
        name: 'Ananya Deshmukh',
        email: 'customer@cloudkitchen.com',
        password: customerPassword,
        phone: '+91 98765 88990',
        role: 'customer',
        addresses: [
          {
            label: 'Home',
            street: 'Flat 402, Sunshine Heights, 4th Cross Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560038',
            landmark: 'Opposite Metro Station',
            isDefault: true,
          },
          {
            label: 'Work',
            street: '6th Floor, Tech Innovation Park, Outer Ring Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560103',
            landmark: 'Next to Starbucks',
            isDefault: false,
          },
        ],
      }),
    ]);

    // 3. Ingredients
    const ingredients = await Ingredient.insertMany([
      { name: 'Mozzarella & Parmesan Cheese Blend', currentStock: 25.5, unit: 'kg', lowStockThreshold: 5, costPerUnit: 450 },
      { name: 'San Marzano Tomato Sauce', currentStock: 18.0, unit: 'l', lowStockThreshold: 4, costPerUnit: 180 },
      { name: 'Handmade Sourdough Pizza Crusts', currentStock: 45, unit: 'pcs', lowStockThreshold: 10, costPerUnit: 40 },
      { name: 'Organic Royal Basmati Rice', currentStock: 35.0, unit: 'kg', lowStockThreshold: 8, costPerUnit: 120 },
      { name: 'Farm-Fresh Paneer (Cottage Cheese)', currentStock: 14.0, unit: 'kg', lowStockThreshold: 3, costPerUnit: 340 },
      { name: 'Tender Marinated Chicken Thighs', currentStock: 22.0, unit: 'kg', lowStockThreshold: 5, costPerUnit: 280 },
      { name: 'Brioche Gourmet Buns', currentStock: 60, unit: 'pcs', lowStockThreshold: 12, costPerUnit: 25 },
      { name: 'Fresh Exotic Herbs & Truffle Oil', currentStock: 4.5, unit: 'l', lowStockThreshold: 1, costPerUnit: 1200 },
      { name: 'Belgian 70% Dark Chocolate', currentStock: 12.0, unit: 'kg', lowStockThreshold: 2.5, costPerUnit: 900 },
      { name: 'Fresh Alphonso Mango Puree', currentStock: 9.0, unit: 'l', lowStockThreshold: 2, costPerUnit: 350 },
    ]);

    // 4. Categories
    const categories = await Category.insertMany([
      {
        name: 'Woodfired Artisanal Pizzas',
        slug: 'woodfired-pizzas',
        description: 'Slow-fermented sourdough pizzas baked with buffalo mozzarella and San Marzano tomatoes.',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
        order: 1,
        isActive: true,
      },
      {
        name: 'Gourmet Smash Burgers',
        slug: 'gourmet-burgers',
        description: 'Juicy handcrafted patties stacked between buttery toasted brioche buns with signature house sauces.',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop',
        order: 2,
        isActive: true,
      },
      {
        name: 'Royal Dum Biryanis & Bowls',
        slug: 'royal-biryanis',
        description: 'Slow-cooked in sealed earthen handis infused with pure saffron, cardamom, and aromatic aged basmati.',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
        order: 3,
        isActive: true,
      },
      {
        name: 'Pan-Asian Wok & Dimsums',
        slug: 'pan-asian',
        description: 'Steaming crystal dimsums, spicy drunken noodles, and wok-tossed sizzling rice.',
        image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=1000&auto=format&fit=crop',
        order: 4,
        isActive: true,
      },
      {
        name: 'Artisanal Desserts & Bakes',
        slug: 'desserts',
        description: 'Decadent chocolate ganache cakes, molten lava cakes, and velvety cheesecakes.',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop',
        order: 5,
        isActive: true,
      },
      {
        name: 'Craft Beverages & Coolers',
        slug: 'beverages',
        description: 'Handcrafted cold-brews, botanical sodas, and fresh fruit iced quenchers.',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1000&auto=format&fit=crop',
        order: 6,
        isActive: true,
      },
    ]);

    // 5. Products
    const products = await Product.insertMany([
      {
        name: 'Truffle Mushroom & Burrata Pizza',
        slug: 'truffle-mushroom-burrata-pizza',
        description: 'Crispy sourdough base with wild forest mushrooms, creamy artisanal burrata cheese, and aromatic Italian white truffle oil.',
        price: 549,
        originalPrice: 649,
        categoryId: categories[0]._id,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
        isVeg: true,
        isBestseller: true,
        isAvailable: true,
        inStock: true,
        stockCount: 25,
        prepTimeMinutes: 20,
        calories: 780,
        addOns: [
          { name: 'Extra Truffle Burrata Globe', price: 120 },
          { name: 'Garlic Butter Herb Crust', price: 45 },
          { name: 'Fiery Jalapeño Dip', price: 35 },
        ],
        ingredientsNeeded: [
          { ingredientId: ingredients[0]._id, quantityRequired: 0.15 },
          { ingredientId: ingredients[1]._id, quantityRequired: 0.1 },
          { ingredientId: ingredients[2]._id, quantityRequired: 1 },
          { ingredientId: ingredients[7]._id, quantityRequired: 0.02 },
        ],
        rating: 4.9,
        numReviews: 48,
      },
      {
        name: 'Classic Margherita Con Bufala',
        slug: 'classic-margherita-con-bufala',
        description: 'San Marzano DOP tomato sauce, fresh buffalo mozzarella, fragrant Genovese basil leaves, and extra virgin olive oil.',
        price: 429,
        originalPrice: 499,
        categoryId: categories[0]._id,
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=1000&auto=format&fit=crop',
        isVeg: true,
        isBestseller: false,
        isAvailable: true,
        inStock: true,
        stockCount: 40,
        prepTimeMinutes: 18,
        calories: 650,
        addOns: [
          { name: 'Extra Mozzarella Melt', price: 80 },
          { name: 'Kalamata Olives', price: 50 },
        ],
        ingredientsNeeded: [
          { ingredientId: ingredients[0]._id, quantityRequired: 0.12 },
          { ingredientId: ingredients[1]._id, quantityRequired: 0.1 },
          { ingredientId: ingredients[2]._id, quantityRequired: 1 },
        ],
        rating: 4.8,
        numReviews: 32,
      },
      {
        name: 'Smoked Chicken & Peri-Peri Sourdough Pizza',
        slug: 'smoked-chicken-peri-peri-pizza',
        description: 'Spiced slow-smoked chicken tenders, roasted bell peppers, red onions, smoked scamorza, and house peri-peri drizzle.',
        price: 579,
        originalPrice: 699,
        categoryId: categories[0]._id,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop',
        isVeg: false,
        isBestseller: true,
        isAvailable: true,
        inStock: true,
        stockCount: 20,
        prepTimeMinutes: 22,
        calories: 840,
        addOns: [
          { name: 'Double Smoked Chicken', price: 110 },
          { name: 'Cheesy Jalapeño Crust', price: 60 },
        ],
        ingredientsNeeded: [
          { ingredientId: ingredients[0]._id, quantityRequired: 0.15 },
          { ingredientId: ingredients[2]._id, quantityRequired: 1 },
          { ingredientId: ingredients[5]._id, quantityRequired: 0.18 },
        ],
        rating: 4.9,
        numReviews: 64,
      },
      {
        name: 'Signature Truffle Swiss Smash Burger',
        slug: 'signature-truffle-swiss-burger',
        description: 'Double seared smash patty with melted aged Swiss cheese, caramelized balsamic onions, and rich black truffle aioli in a toasted brioche bun.',
        price: 389,
        originalPrice: 449,
        categoryId: categories[1]._id,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop',
        isVeg: false,
        isBestseller: true,
        isAvailable: true,
        inStock: true,
        stockCount: 30,
        prepTimeMinutes: 15,
        calories: 720,
        addOns: [
          { name: 'Extra Crispy Bacon Strips', price: 90 },
          { name: 'Cajun Seasoned Potato Wedges', price: 79 },
          { name: 'Truffle Dip', price: 40 },
        ],
        ingredientsNeeded: [
          { ingredientId: ingredients[5]._id, quantityRequired: 0.15 },
          { ingredientId: ingredients[6]._id, quantityRequired: 1 },
          { ingredientId: ingredients[7]._id, quantityRequired: 0.01 },
        ],
        rating: 4.9,
        numReviews: 53,
      },
      {
        name: 'Crispy Paneer Makhani Brioche Burger',
        slug: 'crispy-paneer-makhani-burger',
        description: 'Golden crumbed artisanal cottage cheese steak drenched in luscious rich makhani sauce, mint mayonnaise, and crunchy lachha onions.',
        price: 329,
        originalPrice: 389,
        categoryId: categories[1]._id,
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop',
        isVeg: true,
        isBestseller: true,
        isAvailable: true,
        inStock: true,
        stockCount: 35,
        prepTimeMinutes: 15,
        calories: 610,
        addOns: [
          { name: 'Extra Cheddar Cheese Slice', price: 40 },
          { name: 'Peri-Peri Crinkle Fries', price: 89 },
        ],
        ingredientsNeeded: [
          { ingredientId: ingredients[4]._id, quantityRequired: 0.12 },
          { ingredientId: ingredients[6]._id, quantityRequired: 1 },
        ],
        rating: 4.7,
        numReviews: 41,
      },
      {
        name: 'Royal Awadhi Dum Chicken Biryani',
        slug: 'royal-awadhi-chicken-biryani',
        description: 'Tender prime chicken cooked on slow steam (Dum) with aged long-grain basmati rice, organic saffron, kewra water, and caramelised onions. Served with Burani Raita & Mirchi ka Salan.',
        price: 449,
        originalPrice: 529,
        categoryId: categories[2]._id,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
        isVeg: false,
        isBestseller: true,
        isAvailable: true,
        inStock: true,
        stockCount: 50,
        prepTimeMinutes: 25,
        calories: 890,
        addOns: [
          { name: 'Extra Chicken Piece & Boiled Egg', price: 95 },
          { name: 'Pomegranate Beetroot Raita', price: 45 },
          { name: 'Gulab Jamun (2 pcs)', price: 65 },
        ],
        ingredientsNeeded: [
          { ingredientId: ingredients[3]._id, quantityRequired: 0.2 },
          { ingredientId: ingredients[5]._id, quantityRequired: 0.25 },
        ],
        rating: 4.9,
        numReviews: 89,
      },
      {
        name: 'Edamame & Truffle Crystal Dumplings (6 Pcs)',
        slug: 'edamame-truffle-crystal-dumplings',
        description: 'Translucent steamed crystal dumplings stuffed with mashed organic edamame, water chestnuts, and fragrant black truffle oil. Served with chili crisp and scallion soy dip.',
        price: 389,
        originalPrice: 450,
        categoryId: categories[3]._id,
        image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=1000&auto=format&fit=crop',
        isVeg: true,
        isBestseller: true,
        isAvailable: true,
        inStock: true,
        stockCount: 22,
        prepTimeMinutes: 18,
        calories: 340,
        addOns: [
          { name: 'Artisanal Chili Oil Jar (50ml)', price: 60 },
          { name: 'Crispy Lotus Stem Chips', price: 89 },
        ],
        ingredientsNeeded: [
          { ingredientId: ingredients[7]._id, quantityRequired: 0.015 },
        ],
        rating: 4.9,
        numReviews: 44,
      },
      {
        name: 'Belgian Molten Chocolate Lava Cake',
        slug: 'belgian-molten-chocolate-cake',
        description: 'Warm artisanal chocolate sponge bursting with liquid 70% dark Belgian chocolate center. Dusted with cocoa powder.',
        price: 249,
        originalPrice: 299,
        categoryId: categories[4]._id,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=1000&auto=format&fit=crop',
        isVeg: true,
        isBestseller: true,
        isAvailable: true,
        inStock: true,
        stockCount: 45,
        prepTimeMinutes: 12,
        calories: 450,
        addOns: [
          { name: 'French Madagascar Vanilla Bean Ice Cream', price: 70 },
          { name: 'Salted Caramel Drizzle', price: 35 },
        ],
        ingredientsNeeded: [
          { ingredientId: ingredients[8]._id, quantityRequired: 0.08 },
        ],
        rating: 5.0,
        numReviews: 76,
      },
      {
        name: 'Alphonso Mango & Passionfruit Cooler',
        slug: 'alphonso-mango-passionfruit-cooler',
        description: 'Sun-ripened Ratnagiri Alphonso mango blended with tangy passionfruit pulp, fresh mint leaves, and effervescent sparkling soda.',
        price: 199,
        originalPrice: 249,
        categoryId: categories[5]._id,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop',
        isVeg: true,
        isBestseller: true,
        isAvailable: true,
        inStock: true,
        stockCount: 50,
        prepTimeMinutes: 8,
        calories: 180,
        addOns: [
          { name: 'Popping Boba Pearls', price: 40 },
        ],
        ingredientsNeeded: [
          { ingredientId: ingredients[9]._id, quantityRequired: 0.1 },
        ],
        rating: 4.8,
        numReviews: 42,
      },
    ]);

    // 6. Coupons
    await Coupon.insertMany([
      {
        code: 'WELCOME50',
        description: '50% Flat Discount on your first gourmet meal order!',
        discountType: 'percentage',
        discountValue: 50,
        minOrderAmount: 299,
        maxDiscountAmount: 150,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        totalUsageLimit: 1000,
        usedCount: 14,
        perCustomerLimit: 1,
        isActive: true,
      },
      {
        code: 'TASTY20',
        description: '20% Off on orders above ₹399',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 399,
        maxDiscountAmount: 200,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        totalUsageLimit: 500,
        usedCount: 48,
        perCustomerLimit: 3,
        isActive: true,
      },
      {
        code: 'FLAT100',
        description: 'Flat ₹100 Off on orders above ₹499',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 499,
        maxDiscountAmount: 100,
        expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        totalUsageLimit: 300,
        usedCount: 22,
        perCustomerLimit: 2,
        isActive: true,
      },
    ]);

    // 7. Seed Active Orders
    await Order.insertMany([
      {
        orderNumber: 'CKP-892101',
        customerId: customerUser._id,
        customerName: customerUser.name,
        customerEmail: customerUser.email,
        customerPhone: customerUser.phone,
        deliveryAddress: customerUser.addresses[0],
        deliveryInstructions: 'Ring second doorbell',
        items: [
          {
            productId: products[0]._id,
            name: products[0].name,
            price: products[0].price,
            quantity: 1,
            isVeg: products[0].isVeg,
            image: products[0].image,
            selectedAddOns: [{ name: 'Extra Truffle Burrata Globe', price: 120 }],
            specialInstructions: 'Crispy crust please',
            itemTotal: 669,
          },
          {
            productId: products[7]._id,
            name: products[7].name,
            price: products[7].price,
            quantity: 1,
            isVeg: products[7].isVeg,
            image: products[7].image,
            selectedAddOns: [],
            itemTotal: 249,
          },
        ],
        subtotal: 918,
        discount: 150,
        couponCode: 'WELCOME50',
        tax: 38.4,
        deliveryFee: 0,
        totalAmount: 806.4,
        paymentMethod: 'razorpay',
        paymentStatus: 'completed',
        status: 'PREPARING',
        statusHistory: [
          { status: 'PENDING', timestamp: new Date(Date.now() - 15 * 60000), note: 'Order placed by customer' },
          { status: 'CONFIRMED', timestamp: new Date(Date.now() - 12 * 60000), note: 'Accepted by Kitchen Staff' },
          { status: 'PREPARING', timestamp: new Date(Date.now() - 8 * 60000), note: 'Chef began baking pizza' },
        ],
        estimatedPrepTimeMinutes: 20,
        kitchenNotes: 'Extra truffle oil drizzle on burrata',
      },
      {
        orderNumber: 'CKP-892102',
        customerId: customerUser._id,
        customerName: customerUser.name,
        customerEmail: customerUser.email,
        customerPhone: customerUser.phone,
        deliveryAddress: customerUser.addresses[0],
        items: [
          {
            productId: products[5]._id,
            name: products[5].name,
            price: products[5].price,
            quantity: 2,
            isVeg: products[5].isVeg,
            image: products[5].image,
            selectedAddOns: [{ name: 'Pomegranate Beetroot Raita', price: 45 }],
            itemTotal: 988,
          },
          {
            productId: products[8]._id,
            name: products[8].name,
            price: products[8].price,
            quantity: 2,
            isVeg: products[8].isVeg,
            image: products[8].image,
            selectedAddOns: [],
            itemTotal: 398,
          },
        ],
        subtotal: 1386,
        discount: 200,
        couponCode: 'TASTY20',
        tax: 59.3,
        deliveryFee: 0,
        totalAmount: 1245.3,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'CONFIRMED',
        statusHistory: [
          { status: 'PENDING', timestamp: new Date(Date.now() - 5 * 60000), note: 'Order placed via COD' },
          { status: 'CONFIRMED', timestamp: new Date(Date.now() - 2 * 60000), note: 'Order Confirmed' },
        ],
        estimatedPrepTimeMinutes: 25,
      },
      {
        orderNumber: 'CKP-892103',
        customerId: customerUser._id,
        customerName: 'Rohan Verma',
        customerEmail: 'rohan.v@example.com',
        customerPhone: '+91 99112 33445',
        deliveryAddress: {
          label: 'Home',
          street: 'Villa 12, Palm Meadows, Whitefield',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560066',
        },
        items: [
          {
            productId: products[3]._id,
            name: products[3].name,
            price: products[3].price,
            quantity: 2,
            isVeg: products[3].isVeg,
            image: products[3].image,
            selectedAddOns: [{ name: 'Cajun Seasoned Potato Wedges', price: 79 }],
            itemTotal: 936,
          },
        ],
        subtotal: 936,
        discount: 100,
        couponCode: 'FLAT100',
        tax: 41.8,
        deliveryFee: 0,
        totalAmount: 877.8,
        paymentMethod: 'razorpay',
        paymentStatus: 'completed',
        status: 'PENDING',
        statusHistory: [
          { status: 'PENDING', timestamp: new Date(Date.now() - 1 * 60000), note: 'New order waiting for kitchen acknowledgement' },
        ],
        estimatedPrepTimeMinutes: 15,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with demo products, users, coupons, and orders!',
    });
  } catch (error: any) {
    console.error('API seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}
