import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseUrl.includes('placeholder')) {
  console.error('\n❌ Supabase Configuration Missing or Placeholder Detected!');
  console.error('Please configure your real Supabase credentials in .env.local:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seedSupabase() {
  console.log('--- Starting CloudKitchen Pro Supabase Seeder ---');
  console.log(`Target Supabase URL: ${supabaseUrl}`);

  // Test connection
  const { data: testSettings, error: testErr } = await supabase.from('restaurant_settings').select('count').limit(1);
  if (testErr) {
    console.error('❌ Connection test failed:', testErr.message);
    console.error('Tip: Ensure you have executed `supabase/schema.sql` in your Supabase SQL Editor first!');
    process.exit(1);
  }

  console.log('Cleaning existing table data...');
  // Delete in reverse dependency order
  const tables = [
    'order_items',
    'delivery_assignments',
    'inventory_transactions',
    'reviews',
    'notifications',
    'orders',
    'products',
    'coupons',
    'categories',
    'ingredients',
    'users',
    'restaurant_settings',
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error && !error.message.includes('foreign key')) {
      // ignore
    }
  }

  // 1. Restaurant Settings
  console.log('Seeding Restaurant Settings...');
  const { data: settingsData, error: settingsErr } = await supabase.from('restaurant_settings').insert({
    name: 'CloudKitchen Pro',
    tagline: 'Artisanal Flavors, Delivered Hot & Fresh',
    description: 'Premier multi-brand cloud kitchen delivering chef-curated gourmet meals, artisanal pizzas, authentic biryanis, and handcrafted desserts.',
    phone: '+91 98765 43210',
    email: 'hello@cloudkitchenpro.com',
    address: 'Indiranagar 100ft Road, Stage 2, Bengaluru, Karnataka 560038',
    opening_time: '10:00 AM',
    closing_time: '11:45 PM',
    delivery_fee: 40,
    min_order_for_free_delivery: 499,
    tax_rate_percentage: 5,
    is_kitchen_accepting_orders: true,
    estimated_delivery_time_minutes: 30,
    currency_symbol: '₹',
  }).select().single();

  if (settingsErr) {
    console.warn('Settings insert warning:', settingsErr.message);
  }

  // 2. Users
  console.log('Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const kitchenPassword = await bcrypt.hash('Kitchen@123', salt);
  const customerPassword = await bcrypt.hash('Customer@123', salt);
  const deliveryPassword = await bcrypt.hash('Delivery@123', salt);

  const usersToInsert = [
    {
      name: 'Vikram Mehta (Owner & Admin)',
      email: 'admin@cloudkitchen.com',
      password: adminPassword,
      phone: '+91 98000 11111',
      role: 'admin',
      addresses: [],
      favorites: [],
    },
    {
      name: 'Chef Rajesh Sharma (Head Chef)',
      email: 'kitchen@cloudkitchen.com',
      password: kitchenPassword,
      phone: '+91 98000 22222',
      role: 'kitchen',
      addresses: [],
      favorites: [],
    },
    {
      name: 'Santosh Kumar (Express Delivery)',
      email: 'delivery@cloudkitchen.com',
      password: deliveryPassword,
      phone: '+91 98000 33333',
      role: 'delivery',
      vehicle_type: 'Bike',
      vehicle_number: 'KA-03-HA-4819',
      is_available: true,
      active_status: 'active',
      total_deliveries_completed: 142,
      rating: 4.9,
      addresses: [],
      favorites: [],
    },
    {
      name: 'Amit Verma (Eco Fleet)',
      email: 'rider2@cloudkitchen.com',
      password: deliveryPassword,
      phone: '+91 98000 44444',
      role: 'delivery',
      vehicle_type: 'Electric Bike',
      vehicle_number: 'KA-05-EV-1022',
      is_available: true,
      active_status: 'active',
      total_deliveries_completed: 98,
      rating: 4.8,
      addresses: [],
      favorites: [],
    },
    {
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
          label: 'Office',
          street: '6th Floor, Tech Innovation Park, Outer Ring Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560103',
          landmark: 'Next to Starbucks',
          isDefault: false,
        },
      ],
      favorites: [],
    },
  ];

  const { data: insertedUsers, error: usersErr } = await supabase.from('users').insert(usersToInsert).select();
  if (usersErr) throw usersErr;

  const adminUser = insertedUsers.find((u) => u.role === 'admin');
  const kitchenUser = insertedUsers.find((u) => u.role === 'kitchen');
  const rider1User = insertedUsers.find((u) => u.email === 'delivery@cloudkitchen.com');
  const customerUser = insertedUsers.find((u) => u.role === 'customer');

  // 3. Ingredients
  console.log('Seeding Ingredients...');
  const ingredientsData = [
    { name: 'Mozzarella & Parmesan Cheese Blend', current_stock: 25.5, unit: 'kg', low_stock_threshold: 5, cost_per_unit: 450 },
    { name: 'San Marzano Tomato Sauce', current_stock: 18.0, unit: 'l', low_stock_threshold: 4, cost_per_unit: 180 },
    { name: 'Handmade Sourdough Pizza Crusts', current_stock: 45, unit: 'pcs', low_stock_threshold: 10, cost_per_unit: 40 },
    { name: 'Organic Royal Basmati Rice', current_stock: 35.0, unit: 'kg', low_stock_threshold: 8, cost_per_unit: 120 },
    { name: 'Farm-Fresh Paneer (Cottage Cheese)', current_stock: 14.0, unit: 'kg', low_stock_threshold: 3, cost_per_unit: 340 },
    { name: 'Tender Marinated Chicken Thighs', current_stock: 22.0, unit: 'kg', low_stock_threshold: 5, cost_per_unit: 280 },
    { name: 'Brioche Gourmet Buns', current_stock: 60, unit: 'pcs', low_stock_threshold: 12, cost_per_unit: 25 },
    { name: 'Fresh Exotic Herbs & Truffle Oil', current_stock: 4.5, unit: 'l', low_stock_threshold: 1, cost_per_unit: 1200 },
    { name: 'Belgian 70% Dark Chocolate', current_stock: 12.0, unit: 'kg', low_stock_threshold: 2.5, cost_per_unit: 900 },
    { name: 'Fresh Alphonso Mango Puree', current_stock: 9.0, unit: 'l', low_stock_threshold: 2, cost_per_unit: 350 },
  ];

  const { data: insertedIngredients, error: ingErr } = await supabase.from('ingredients').insert(ingredientsData).select();
  if (ingErr) throw ingErr;

  // 4. Categories
  console.log('Seeding Categories...');
  const categoriesData = [
    {
      name: 'Woodfired Artisanal Pizzas',
      slug: 'woodfired-pizzas',
      description: 'Slow-fermented sourdough pizzas baked with buffalo mozzarella and San Marzano tomatoes.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
      order_index: 1,
      is_active: true,
    },
    {
      name: 'Gourmet Smash Burgers',
      slug: 'gourmet-burgers',
      description: 'Juicy handcrafted patties stacked between buttery toasted brioche buns with signature house sauces.',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop',
      order_index: 2,
      is_active: true,
    },
    {
      name: 'Royal Dum Biryanis & Bowls',
      slug: 'royal-biryanis',
      description: 'Slow-cooked in sealed earthen handis infused with pure saffron, cardamom, and aromatic aged basmati.',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
      order_index: 3,
      is_active: true,
    },
    {
      name: 'Pan-Asian Wok & Dimsums',
      slug: 'pan-asian',
      description: 'Steaming crystal dimsums, spicy drunken noodles, and wok-tossed sizzling rice.',
      image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=1000&auto=format&fit=crop',
      order_index: 4,
      is_active: true,
    },
    {
      name: 'Artisanal Desserts & Bakes',
      slug: 'desserts',
      description: 'Decadent chocolate ganache cakes, molten lava cakes, and velvety cheesecakes.',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop',
      order_index: 5,
      is_active: true,
    },
    {
      name: 'Craft Beverages & Coolers',
      slug: 'beverages',
      description: 'Handcrafted cold-brews, botanical sodas, and fresh fruit iced quenchers.',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1000&auto=format&fit=crop',
      order_index: 6,
      is_active: true,
    },
  ];

  const { data: insertedCategories, error: catErr } = await supabase.from('categories').insert(categoriesData).select();
  if (catErr) throw catErr;

  const catMap = Object.fromEntries(insertedCategories.map((c) => [c.slug, c.id]));

  // 5. Products
  console.log('Seeding Products...');
  const productsData = [
    {
      name: 'Truffle Mushroom & Burrata Pizza',
      slug: 'truffle-mushroom-burrata-pizza',
      description: 'Crispy sourdough base with wild forest mushrooms, creamy artisanal burrata cheese, and aromatic Italian white truffle oil.',
      price: 549,
      original_price: 649,
      category_id: catMap['woodfired-pizzas'],
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
      is_veg: true,
      is_bestseller: true,
      is_available: true,
      in_stock: true,
      stock_count: 25,
      prep_time_minutes: 20,
      calories: 780,
      add_ons: [
        { name: 'Extra Truffle Burrata Globe', price: 120 },
        { name: 'Garlic Butter Herb Crust', price: 45 },
        { name: 'Fiery Jalapeño Dip', price: 35 },
      ],
      rating: 4.9,
      num_reviews: 48,
    },
    {
      name: 'Classic Margherita Con Bufala',
      slug: 'classic-margherita-con-bufala',
      description: 'San Marzano DOP tomato sauce, fresh buffalo mozzarella, fragrant Genovese basil leaves, and extra virgin olive oil.',
      price: 429,
      original_price: 499,
      category_id: catMap['woodfired-pizzas'],
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=1000&auto=format&fit=crop',
      is_veg: true,
      is_bestseller: false,
      is_available: true,
      in_stock: true,
      stock_count: 40,
      prep_time_minutes: 18,
      calories: 650,
      add_ons: [
        { name: 'Extra Mozzarella Melt', price: 80 },
        { name: 'Kalamata Olives', price: 50 },
      ],
      rating: 4.8,
      num_reviews: 32,
    },
    {
      name: 'Smoked Chicken & Peri-Peri Sourdough Pizza',
      slug: 'smoked-chicken-peri-peri-pizza',
      description: 'Spiced slow-smoked chicken tenders, roasted bell peppers, red onions, smoked scamorza, and house peri-peri drizzle.',
      price: 579,
      original_price: 699,
      category_id: catMap['woodfired-pizzas'],
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop',
      is_veg: false,
      is_bestseller: true,
      is_available: true,
      in_stock: true,
      stock_count: 20,
      prep_time_minutes: 22,
      calories: 840,
      add_ons: [
        { name: 'Double Smoked Chicken', price: 110 },
        { name: 'Cheesy Jalapeño Crust', price: 60 },
      ],
      rating: 4.9,
      num_reviews: 64,
    },
    {
      name: 'Signature Truffle Swiss Smash Burger',
      slug: 'signature-truffle-swiss-burger',
      description: 'Double seared smash patty with melted aged Swiss cheese, caramelized balsamic onions, and rich black truffle aioli in a toasted brioche bun.',
      price: 389,
      original_price: 449,
      category_id: catMap['gourmet-burgers'],
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop',
      is_veg: false,
      is_bestseller: true,
      is_available: true,
      in_stock: true,
      stock_count: 30,
      prep_time_minutes: 15,
      calories: 720,
      add_ons: [
        { name: 'Cajun Seasoned Potato Wedges', price: 79 },
        { name: 'Truffle Dip', price: 40 },
      ],
      rating: 4.9,
      num_reviews: 53,
    },
    {
      name: 'Nawabi Slow-Dum Murgh Biryani',
      slug: 'nawabi-slow-dum-murgh-biryani',
      description: 'Fragrant aged long-grain basmati rice layered with succulent marinated chicken, saffron milk, and aromatic spices cooked under earthen seal.',
      price: 489,
      original_price: 549,
      category_id: catMap['royal-biryanis'],
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
      is_veg: false,
      is_bestseller: true,
      is_available: true,
      in_stock: true,
      stock_count: 35,
      prep_time_minutes: 25,
      calories: 850,
      add_ons: [
        { name: 'Extra Burani Raita & Salan', price: 49 },
        { name: 'Gulab Jamun (2 Pcs)', price: 65 },
      ],
      rating: 4.9,
      num_reviews: 87,
    },
    {
      name: 'Belgian Molten Chocolate Lava Cake',
      slug: 'belgian-molten-chocolate-lava-cake',
      description: 'Warm, gooey molten center with rich 70% dark Belgian cocoa and a dusted powdered sugar crown.',
      price: 249,
      original_price: 299,
      category_id: catMap['desserts'],
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=1000&auto=format&fit=crop',
      is_veg: true,
      is_bestseller: true,
      is_available: true,
      in_stock: true,
      stock_count: 50,
      prep_time_minutes: 10,
      calories: 460,
      add_ons: [
        { name: 'Artisanal Madagascar Vanilla Bean Scoop', price: 75 },
      ],
      rating: 4.9,
      num_reviews: 92,
    },
  ];

  const { data: insertedProducts, error: prodErr } = await supabase.from('products').insert(productsData).select();
  if (prodErr) throw prodErr;

  // 6. Coupons
  console.log('Seeding Coupons...');
  const couponsData = [
    {
      code: 'WELCOME50',
      description: '50% off on your first gourmet order up to ₹150',
      discount_type: 'percentage',
      discount_value: 50,
      min_order_amount: 299,
      max_discount_amount: 150,
      expiry_date: new Date(Date.now() + 90 * 86400000).toISOString(),
      is_active: true,
    },
    {
      code: 'TASTY20',
      description: '20% off on all artisanal orders above ₹499',
      discount_type: 'percentage',
      discount_value: 20,
      min_order_amount: 499,
      max_discount_amount: 200,
      expiry_date: new Date(Date.now() + 60 * 86400000).toISOString(),
      is_active: true,
    },
    {
      code: 'FLAT100',
      description: 'Flat ₹100 instant discount on royal orders above ₹699',
      discount_type: 'fixed',
      discount_value: 100,
      min_order_amount: 699,
      max_discount_amount: 100,
      expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      is_active: true,
    },
    {
      code: 'CHEFSPECIAL',
      description: 'Chef recommendation special 15% discount',
      discount_type: 'percentage',
      discount_value: 15,
      min_order_amount: 399,
      max_discount_amount: 250,
      expiry_date: new Date(Date.now() + 45 * 86400000).toISOString(),
      is_active: true,
    },
  ];

  const { error: coupErr } = await supabase.from('coupons').insert(couponsData);
  if (coupErr) throw coupErr;

  // 7. Orders
  console.log('Seeding Sample Orders...');
  const sampleOrder = {
    order_number: 'CKP-892110',
    customer_id: customerUser?.id,
    customer_name: 'Ananya Deshmukh',
    customer_email: 'customer@cloudkitchen.com',
    customer_phone: '+91 98765 88990',
    delivery_address: {
      label: 'Home',
      street: 'Flat 402, Sunshine Heights, 4th Cross Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    subtotal: 669,
    discount: 50,
    coupon_code: 'WELCOME50',
    tax: 30.95,
    delivery_fee: 0,
    total_amount: 649.95,
    payment_method: 'razorpay',
    payment_status: 'completed',
    status: 'OUT_FOR_DELIVERY',
    delivery_otp: '4928',
    delivery_staff_id: rider1User?.id,
    delivery_staff_name: 'Santosh Kumar',
    delivery_staff_phone: '+91 98000 33333',
    status_history: [
      { status: 'PENDING', timestamp: new Date(Date.now() - 35 * 60000).toISOString() },
      { status: 'CONFIRMED', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
      { status: 'PREPARING', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
      { status: 'READY_FOR_PICKUP', timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
      { status: 'OUT_FOR_DELIVERY', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), note: 'Picked up by Santosh Kumar' },
    ],
  };

  const { data: createdOrder, error: orderErr } = await supabase.from('orders').insert(sampleOrder).select().single();
  if (orderErr) throw orderErr;

  if (createdOrder) {
    // Add Order Item
    await supabase.from('order_items').insert({
      order_id: createdOrder.id,
      product_id: insertedProducts[0]?.id,
      name: 'Truffle Mushroom & Burrata Pizza',
      price: 549,
      quantity: 1,
      is_veg: true,
      image: insertedProducts[0]?.image,
      selected_add_ons: [{ name: 'Extra Truffle Burrata Globe', price: 120 }],
      item_total: 669,
    });

    // Add Delivery Assignment
    await supabase.from('delivery_assignments').insert({
      order_id: createdOrder.id,
      delivery_staff_id: rider1User?.id,
      delivery_staff_name: 'Santosh Kumar',
      delivery_staff_phone: '+91 98000 33333',
      status: 'OUT_FOR_DELIVERY',
      delivery_otp: '4928',
      otp_verified: false,
      assigned_at: new Date(Date.now() - 20 * 60000).toISOString(),
      accepted_at: new Date(Date.now() - 18 * 60000).toISOString(),
      picked_up_at: new Date(Date.now() - 12 * 60000).toISOString(),
      current_location: { lat: 12.9716, lng: 77.5946, updated_at: new Date().toISOString() },
    });
  }

  console.log('✅ Supabase Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Credentials Summary:');
  console.log('👑 Admin:    admin@cloudkitchen.com    / Admin@123');
  console.log('👨‍🍳 Kitchen:  kitchen@cloudkitchen.com  / Kitchen@123');
  console.log('🛵 Delivery: delivery@cloudkitchen.com / Delivery@123 (Santosh Kumar)');
  console.log('🛵 Delivery: rider2@cloudkitchen.com   / Delivery@123 (Amit Verma)');
  console.log('👤 Customer: customer@cloudkitchen.com / Customer@123 (Ananya Deshmukh)');
  console.log('🎟️ Coupons:   WELCOME50, TASTY20, FLAT100, CHEFSPECIAL');
  console.log('--------------------------------------------------');
}

seedSupabase().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
