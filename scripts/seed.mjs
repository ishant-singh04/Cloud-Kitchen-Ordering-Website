import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudkitchen_pro';

async function seed() {
  console.log('--- Starting CloudKitchen Pro Database Seeder ---');
  let connection;
  try {
    connection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB.');
  } catch (err) {
    console.warn('Could not connect to external MongoDB URI. Starting MongoMemoryServer for seeder...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    connection = await mongoose.connect(mongod.getUri());
    console.log('Connected to fallback MongoMemoryServer.');
  }

  const db = connection.connection.db;

  // Clear existing collections
  console.log('Cleaning existing collections...');
  const collections = [
    'users',
    'categories',
    'products',
    'ingredients',
    'coupons',
    'orders',
    'restaurantsettings',
    'reviews',
    'inventorytransactions',
    'deliveryassignments',
    'notifications',
  ];
  for (const c of collections) {
    try {
      await db.collection(c).deleteMany({});
    } catch (e) {
      // ignore
    }
  }

  // 1. Seed Restaurant Settings
  console.log('Seeding Restaurant Settings...');
  await db.collection('restaurantsettings').insertOne({
    name: 'CloudKitchen Pro',
    tagline: 'Artisanal Flavors, Delivered Hot & Fresh',
    description: 'Premier multi-brand cloud kitchen delivering chef-curated gourmet meals, artisanal pizzas, authentic biryanis, and handcrafted desserts.',
    phone: '+91 98765 43210',
    email: 'hello@cloudkitchenpro.com',
    address: 'Indiranagar 100ft Road, Stage 2, Bengaluru, Karnataka 560038',
    openingTime: '10:00 AM',
    closingTime: '11:45 PM',
    deliveryFee: 40,
    minOrderForFreeDelivery: 499,
    taxRatePercentage: 5, // 5% GST
    isKitchenAcceptingOrders: true,
    estimatedDeliveryTimeMinutes: 30,
    currencySymbol: '₹',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 2. Seed Users
  console.log('Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const kitchenPassword = await bcrypt.hash('Kitchen@123', salt);
  const customerPassword = await bcrypt.hash('Customer@123', salt);
  const deliveryPassword = await bcrypt.hash('Delivery@123', salt);

  const adminUser = {
    name: 'Vikram Mehta (Owner & Admin)',
    email: 'admin@cloudkitchen.com',
    password: adminPassword,
    phone: '+91 98000 11111',
    role: 'admin',
    addresses: [],
    favorites: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const kitchenUser = {
    name: 'Chef Rajesh Sharma (Head Chef)',
    email: 'kitchen@cloudkitchen.com',
    password: kitchenPassword,
    phone: '+91 98000 22222',
    role: 'kitchen',
    addresses: [],
    favorites: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const deliveryUser1 = {
    name: 'Santosh Kumar (Express Delivery)',
    email: 'delivery@cloudkitchen.com',
    password: deliveryPassword,
    phone: '+91 98000 33333',
    role: 'delivery',
    vehicleType: 'Bike',
    vehicleNumber: 'KA-03-HA-4819',
    isAvailable: true,
    activeStatus: 'active',
    totalDeliveriesCompleted: 142,
    rating: 4.9,
    addresses: [],
    favorites: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const deliveryUser2 = {
    name: 'Amit Verma (Eco Fleet)',
    email: 'rider2@cloudkitchen.com',
    password: deliveryPassword,
    phone: '+91 98000 44444',
    role: 'delivery',
    vehicleType: 'Electric Bike',
    vehicleNumber: 'KA-05-EV-1022',
    isAvailable: true,
    activeStatus: 'active',
    totalDeliveriesCompleted: 98,
    rating: 4.8,
    addresses: [],
    favorites: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const customerUser = {
    name: 'Ananya Deshmukh',
    email: 'customer@cloudkitchen.com',
    password: customerPassword,
    phone: '+91 98765 88990',
    role: 'customer',
    addresses: [
      {
        _id: new mongoose.Types.ObjectId(),
        label: 'Home',
        street: 'Flat 402, Sunshine Heights, 4th Cross Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        landmark: 'Opposite Metro Station',
        isDefault: true,
      },
      {
        _id: new mongoose.Types.ObjectId(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const insertedUsers = await db.collection('users').insertMany([
    adminUser,
    kitchenUser,
    deliveryUser1,
    deliveryUser2,
    customerUser,
  ]);
  const adminId = insertedUsers.insertedIds[0];
  const kitchenId = insertedUsers.insertedIds[1];
  const deliveryStaff1Id = insertedUsers.insertedIds[2];
  const deliveryStaff2Id = insertedUsers.insertedIds[3];
  const customerId = insertedUsers.insertedIds[4];

  // 3. Seed Ingredients
  console.log('Seeding Ingredients...');
  const ingredientsData = [
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
  ];

  const ingredientDocs = ingredientsData.map((ing) => ({
    ...ing,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const insertedIngredients = await db.collection('ingredients').insertMany(ingredientDocs);
  const ingIds = insertedIngredients.insertedIds;

  // 4. Seed Categories
  console.log('Seeding Categories...');
  const categoriesData = [
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
  ];

  const categoryDocs = categoriesData.map((cat) => ({
    ...cat,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const insertedCategories = await db.collection('categories').insertMany(categoryDocs);
  const catIds = insertedCategories.insertedIds;

  // 5. Seed Products
  console.log('Seeding Products...');
  const productsData = [
    // Woodfired Pizzas
    {
      name: 'Truffle Mushroom & Burrata Pizza',
      slug: 'truffle-mushroom-burrata-pizza',
      description: 'Crispy sourdough base with wild forest mushrooms, creamy artisanal burrata cheese, and aromatic Italian white truffle oil.',
      price: 549,
      originalPrice: 649,
      categoryId: catIds[0],
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
        { ingredientId: ingIds[0], quantityRequired: 0.15 },
        { ingredientId: ingIds[1], quantityRequired: 0.1 },
        { ingredientId: ingIds[2], quantityRequired: 1 },
        { ingredientId: ingIds[7], quantityRequired: 0.02 },
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
      categoryId: catIds[0],
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
        { ingredientId: ingIds[0], quantityRequired: 0.12 },
        { ingredientId: ingIds[1], quantityRequired: 0.1 },
        { ingredientId: ingIds[2], quantityRequired: 1 },
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
      categoryId: catIds[0],
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
        { ingredientId: ingIds[0], quantityRequired: 0.15 },
        { ingredientId: ingIds[2], quantityRequired: 1 },
        { ingredientId: ingIds[5], quantityRequired: 0.18 },
      ],
      rating: 4.9,
      numReviews: 64,
    },

    // Gourmet Smash Burgers
    {
      name: 'Signature Truffle Swiss Smash Burger',
      slug: 'signature-truffle-swiss-burger',
      description: 'Double seared smash patty with melted aged Swiss cheese, caramelized balsamic onions, and rich black truffle aioli in a toasted brioche bun.',
      price: 389,
      originalPrice: 449,
      categoryId: catIds[1],
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
        { ingredientId: ingIds[5], quantityRequired: 0.15 },
        { ingredientId: ingIds[6], quantityRequired: 1 },
        { ingredientId: ingIds[7], quantityRequired: 0.01 },
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
      categoryId: catIds[1],
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
        { ingredientId: ingIds[4], quantityRequired: 0.12 },
        { ingredientId: ingIds[6], quantityRequired: 1 },
      ],
      rating: 4.7,
      numReviews: 41,
    },

    // Royal Biryanis
    {
      name: 'Royal Awadhi Dum Chicken Biryani',
      slug: 'royal-awadhi-chicken-biryani',
      description: 'Tender prime chicken cooked on slow steam (Dum) with aged long-grain basmati rice, organic saffron, kewra water, and caramelised onions. Served with Burani Raita & Mirchi ka Salan.',
      price: 449,
      originalPrice: 529,
      categoryId: catIds[2],
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
        { ingredientId: ingIds[3], quantityRequired: 0.2 },
        { ingredientId: ingIds[5], quantityRequired: 0.25 },
      ],
      rating: 4.9,
      numReviews: 89,
    },
    {
      name: 'Shahi Malai Paneer Subz Biryani',
      slug: 'shahi-malai-paneer-subz-biryani',
      description: 'Succulent malai paneer cubes, baby corn, florets of broccoli, and French beans simmered in aromatic saffron rice and royal spices.',
      price: 399,
      originalPrice: 469,
      categoryId: catIds[2],
      image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=1000&auto=format&fit=crop',
      isVeg: true,
      isBestseller: false,
      isAvailable: true,
      inStock: true,
      stockCount: 28,
      prepTimeMinutes: 20,
      calories: 740,
      addOns: [
        { name: 'Extra Roasted Paneer Cubes', price: 80 },
        { name: 'Creamy Cucumber Raita', price: 40 },
      ],
      ingredientsNeeded: [
        { ingredientId: ingIds[3], quantityRequired: 0.2 },
        { ingredientId: ingIds[4], quantityRequired: 0.15 },
      ],
      rating: 4.8,
      numReviews: 38,
    },

    // Pan-Asian Wok & Dimsums
    {
      name: 'Edamame & Truffle Crystal Dumplings (6 Pcs)',
      slug: 'edamame-truffle-crystal-dumplings',
      description: 'Translucent steamed crystal dumplings stuffed with mashed organic edamame, water chestnuts, and fragrant black truffle oil. Served with chili crisp and scallion soy dip.',
      price: 389,
      originalPrice: 450,
      categoryId: catIds[3],
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
        { ingredientId: ingIds[7], quantityRequired: 0.015 },
      ],
      rating: 4.9,
      numReviews: 44,
    },
    {
      name: 'Szechuan Fiery Chicken Dan Dan Noodles',
      slug: 'szechuan-fiery-chicken-noodles',
      description: 'Hand-pulled wheat noodles tossed in fiery Szechuan chili oil, toasted sesame peanut paste, crispy minced chicken, bok choy, and crushed Sichuan peppercorns.',
      price: 379,
      originalPrice: 429,
      categoryId: catIds[3],
      image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=1000&auto=format&fit=crop',
      isVeg: false,
      isBestseller: false,
      isAvailable: true,
      inStock: true,
      stockCount: 30,
      prepTimeMinutes: 16,
      calories: 620,
      addOns: [
        { name: 'Runny Fried Egg', price: 35 },
        { name: 'Steamed Chicken Dumplings (3 pcs)', price: 99 },
      ],
      ingredientsNeeded: [
        { ingredientId: ingIds[5], quantityRequired: 0.15 },
      ],
      rating: 4.7,
      numReviews: 29,
    },

    // Desserts
    {
      name: 'Belgian Molten Chocolate Lava Cake',
      slug: 'belgian-molten-chocolate-cake',
      description: 'Warm artisanal chocolate sponge bursting with liquid 70% dark Belgian chocolate center. Dusted with cocoa powder.',
      price: 249,
      originalPrice: 299,
      categoryId: catIds[4],
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
        { ingredientId: ingIds[8], quantityRequired: 0.08 },
      ],
      rating: 5.0,
      numReviews: 76,
    },
    {
      name: 'Classic New York Blueberry Cheesecake',
      slug: 'classic-ny-blueberry-cheesecake',
      description: 'Velvety Philadelphia cream cheese set on a buttery graham cracker crust, crowned with compote of sweet wild Maine blueberries.',
      price: 289,
      originalPrice: 349,
      categoryId: catIds[4],
      image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=1000&auto=format&fit=crop',
      isVeg: true,
      isBestseller: false,
      isAvailable: true,
      inStock: true,
      stockCount: 20,
      prepTimeMinutes: 5,
      calories: 490,
      addOns: [
        { name: 'Extra Wild Berry Coulis', price: 40 },
      ],
      ingredientsNeeded: [],
      rating: 4.8,
      numReviews: 35,
    },

    // Beverages
    {
      name: 'Alphonso Mango & Passionfruit Cooler',
      slug: 'alphonso-mango-passionfruit-cooler',
      description: 'Sun-ripened Ratnagiri Alphonso mango blended with tangy passionfruit pulp, fresh mint leaves, and effervescent sparkling soda.',
      price: 199,
      originalPrice: 249,
      categoryId: catIds[5],
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
        { ingredientId: ingIds[9], quantityRequired: 0.1 },
      ],
      rating: 4.8,
      numReviews: 42,
    },
    {
      name: 'Cold-Pressed Valencia Orange & Ginger Fizz',
      slug: 'valencia-orange-ginger-fizz',
      description: '100% pure cold-pressed Valencia oranges lightly spiced with crushed ginger root, Himalayan pink salt, and chilled soda.',
      price: 189,
      originalPrice: 229,
      categoryId: catIds[5],
      image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=1000&auto=format&fit=crop',
      isVeg: true,
      isBestseller: false,
      isAvailable: true,
      inStock: true,
      stockCount: 40,
      prepTimeMinutes: 6,
      calories: 140,
      addOns: [],
      ingredientsNeeded: [],
      rating: 4.6,
      numReviews: 24,
    },
  ];

  const productDocs = productsData.map((prod) => ({
    ...prod,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const insertedProducts = await db.collection('products').insertMany(productDocs);
  const prodIds = insertedProducts.insertedIds;

  // 6. Seed Coupons
  console.log('Seeding Coupons...');
  const couponsData = [
    {
      code: 'WELCOME50',
      description: '50% Flat Discount on your first gourmet meal order!',
      discountType: 'percentage',
      discountValue: 50,
      minOrderAmount: 299,
      maxDiscountAmount: 150,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days ahead
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
    {
      code: 'CHEFSPECIAL',
      description: 'Special Chef discount: 25% off up to ₹250',
      discountType: 'percentage',
      discountValue: 25,
      minOrderAmount: 599,
      maxDiscountAmount: 250,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalUsageLimit: 200,
      usedCount: 8,
      perCustomerLimit: 1,
      isActive: true,
    },
  ];

  const couponDocs = couponsData.map((c) => ({
    ...c,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  await db.collection('coupons').insertMany(couponDocs);

  // 7. Seed Sample Orders with Live Realistic Lifecycle Statuses
  console.log('Seeding Orders...');
  const sampleOrders = [
    {
      orderNumber: 'CKP-892101',
      customerId: customerId,
      customerName: 'Ananya Deshmukh',
      customerEmail: 'customer@cloudkitchen.com',
      customerPhone: '+91 98765 88990',
      deliveryAddress: customerUser.addresses[0],
      deliveryInstructions: 'Please leave with security or ring the second doorbell.',
      items: [
        {
          productId: prodIds[0],
          name: 'Truffle Mushroom & Burrata Pizza',
          price: 549,
          quantity: 1,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
          selectedAddOns: [{ name: 'Extra Truffle Burrata Globe', price: 120 }],
          specialInstructions: 'Well done crust please',
          itemTotal: 669,
        },
        {
          productId: prodIds[9],
          name: 'Belgian Molten Chocolate Lava Cake',
          price: 249,
          quantity: 1,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=1000&auto=format&fit=crop',
          selectedAddOns: [],
          specialInstructions: 'Keep warm',
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
      razorpayOrderId: 'order_test_mock_101',
      razorpayPaymentId: 'pay_test_mock_101',
      status: 'PREPARING',
      statusHistory: [
        { status: 'PENDING', timestamp: new Date(Date.now() - 15 * 60000), note: 'Order placed by customer' },
        { status: 'CONFIRMED', timestamp: new Date(Date.now() - 12 * 60000), note: 'Accepted by Kitchen Staff' },
        { status: 'PREPARING', timestamp: new Date(Date.now() - 8 * 60000), note: 'Chef began baking pizza' },
      ],
      estimatedPrepTimeMinutes: 20,
      kitchenNotes: 'Extra truffle oil drizzle on burrata',
      createdAt: new Date(Date.now() - 15 * 60000),
      updatedAt: new Date(Date.now() - 8 * 60000),
    },
    {
      orderNumber: 'CKP-892102',
      customerId: customerId,
      customerName: 'Ananya Deshmukh',
      customerEmail: 'customer@cloudkitchen.com',
      customerPhone: '+91 98765 88990',
      deliveryAddress: customerUser.addresses[0],
      deliveryInstructions: 'Ring bell twice',
      items: [
        {
          productId: prodIds[5],
          name: 'Royal Awadhi Dum Chicken Biryani',
          price: 449,
          quantity: 2,
          isVeg: false,
          image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
          selectedAddOns: [{ name: 'Pomegranate Beetroot Raita', price: 45 }],
          specialInstructions: 'Make it medium spicy',
          itemTotal: 988,
        },
        {
          productId: prodIds[11],
          name: 'Alphonso Mango & Passionfruit Cooler',
          price: 199,
          quantity: 2,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop',
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
        { status: 'PENDING', timestamp: new Date(Date.now() - 5 * 60000), note: 'Order placed by customer via COD' },
        { status: 'CONFIRMED', timestamp: new Date(Date.now() - 2 * 60000), note: 'Auto-confirmed' },
      ],
      estimatedPrepTimeMinutes: 25,
      createdAt: new Date(Date.now() - 5 * 60000),
      updatedAt: new Date(Date.now() - 2 * 60000),
    },
    {
      orderNumber: 'CKP-892103',
      customerId: customerId,
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
          productId: prodIds[3],
          name: 'Signature Truffle Swiss Smash Burger',
          price: 389,
          quantity: 2,
          isVeg: false,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop',
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
      createdAt: new Date(Date.now() - 1 * 60000),
      updatedAt: new Date(Date.now() - 1 * 60000),
    },
    {
      orderNumber: 'CKP-892095',
      customerId: customerId,
      customerName: 'Ananya Deshmukh',
      customerEmail: 'customer@cloudkitchen.com',
      customerPhone: '+91 98765 88990',
      deliveryAddress: customerUser.addresses[0],
      items: [
        {
          productId: prodIds[7],
          name: 'Edamame & Truffle Crystal Dumplings (6 Pcs)',
          price: 389,
          quantity: 1,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=1000&auto=format&fit=crop',
          selectedAddOns: [],
          itemTotal: 389,
        },
      ],
      subtotal: 389,
      discount: 0,
      tax: 19.45,
      deliveryFee: 40,
      totalAmount: 448.45,
      paymentMethod: 'razorpay',
      paymentStatus: 'completed',
      status: 'DELIVERED',
      deliveryOtp: '7192',
      deliveryStaffId: deliveryStaff1Id,
      deliveryStaffName: 'Santosh Kumar',
      deliveryStaffPhone: '+91 98000 33333',
      assignedAt: new Date(Date.now() - 70 * 60000),
      pickedUpAt: new Date(Date.now() - 65 * 60000),
      deliveredAt: new Date(Date.now() - 35 * 60000),
      statusHistory: [
        { status: 'PENDING', timestamp: new Date(Date.now() - 120 * 60000) },
        { status: 'CONFIRMED', timestamp: new Date(Date.now() - 115 * 60000) },
        { status: 'PREPARING', timestamp: new Date(Date.now() - 105 * 60000) },
        { status: 'READY_FOR_PICKUP', timestamp: new Date(Date.now() - 85 * 60000) },
        { status: 'OUT_FOR_DELIVERY', timestamp: new Date(Date.now() - 65 * 60000) },
        { status: 'DELIVERED', timestamp: new Date(Date.now() - 35 * 60000), note: 'Delivered by rider Santosh' },
      ],
      estimatedPrepTimeMinutes: 18,
      createdAt: new Date(Date.now() - 120 * 60000),
      updatedAt: new Date(Date.now() - 35 * 60000),
    },
    {
      orderNumber: 'CKP-892110',
      customerId: customerId,
      customerName: 'Ananya Deshmukh',
      customerEmail: 'customer@cloudkitchen.com',
      customerPhone: '+91 98765 88990',
      deliveryAddress: customerUser.addresses[0],
      items: [
        {
          productId: prodIds[0],
          name: 'Truffle Mushroom & Burrata Pizza',
          price: 549,
          quantity: 1,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
          selectedAddOns: [{ name: 'Extra Truffle Burrata Globe', price: 120 }],
          itemTotal: 669,
        },
      ],
      subtotal: 669,
      discount: 50,
      couponCode: 'WELCOME50',
      tax: 30.95,
      deliveryFee: 0,
      totalAmount: 649.95,
      paymentMethod: 'razorpay',
      paymentStatus: 'completed',
      status: 'OUT_FOR_DELIVERY',
      deliveryOtp: '4928',
      deliveryStaffId: deliveryStaff1Id,
      deliveryStaffName: 'Santosh Kumar',
      deliveryStaffPhone: '+91 98000 33333',
      assignedAt: new Date(Date.now() - 20 * 60000),
      pickedUpAt: new Date(Date.now() - 12 * 60000),
      statusHistory: [
        { status: 'PENDING', timestamp: new Date(Date.now() - 35 * 60000) },
        { status: 'CONFIRMED', timestamp: new Date(Date.now() - 30 * 60000) },
        { status: 'PREPARING', timestamp: new Date(Date.now() - 25 * 60000) },
        { status: 'READY_FOR_PICKUP', timestamp: new Date(Date.now() - 20 * 60000) },
        { status: 'OUT_FOR_DELIVERY', timestamp: new Date(Date.now() - 12 * 60000), note: 'Picked up by Santosh Kumar' },
      ],
      estimatedPrepTimeMinutes: 20,
      createdAt: new Date(Date.now() - 35 * 60000),
      updatedAt: new Date(Date.now() - 12 * 60000),
    },
    {
      orderNumber: 'CKP-892115',
      customerId: customerId,
      customerName: 'Ananya Deshmukh',
      customerEmail: 'customer@cloudkitchen.com',
      customerPhone: '+91 98765 88990',
      deliveryAddress: customerUser.addresses[1],
      items: [
        {
          productId: prodIds[4],
          name: 'Nawabi Slow-Dum Murgh Biryani',
          price: 489,
          quantity: 2,
          isVeg: false,
          image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
          selectedAddOns: [],
          itemTotal: 978,
        },
      ],
      subtotal: 978,
      discount: 0,
      tax: 48.9,
      deliveryFee: 0,
      totalAmount: 1026.9,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'READY_FOR_PICKUP',
      deliveryOtp: '5812',
      statusHistory: [
        { status: 'PENDING', timestamp: new Date(Date.now() - 25 * 60000) },
        { status: 'CONFIRMED', timestamp: new Date(Date.now() - 22 * 60000) },
        { status: 'PREPARING', timestamp: new Date(Date.now() - 20 * 60000) },
        { status: 'READY_FOR_PICKUP', timestamp: new Date(Date.now() - 3 * 60000), note: 'Packed & waiting on pickup counter' },
      ],
      estimatedPrepTimeMinutes: 20,
      createdAt: new Date(Date.now() - 25 * 60000),
      updatedAt: new Date(Date.now() - 3 * 60000),
    },
  ];

  const insertedOrders = await db.collection('orders').insertMany(sampleOrders);
  const orderIds = Object.values(insertedOrders.insertedIds);

  // 8. Seed Delivery Assignments
  console.log('Seeding Delivery Assignments...');
  const activeOrderIndex = sampleOrders.findIndex((o) => o.status === 'OUT_FOR_DELIVERY');
  const deliveredOrderIndex = sampleOrders.findIndex((o) => o.status === 'DELIVERED');

  if (activeOrderIndex >= 0) {
    await db.collection('deliveryassignments').insertOne({
      orderId: orderIds[activeOrderIndex],
      deliveryStaffId: deliveryStaff1Id,
      deliveryStaffName: 'Santosh Kumar',
      deliveryStaffPhone: '+91 98000 33333',
      status: 'OUT_FOR_DELIVERY',
      deliveryOtp: '4928',
      otpVerified: false,
      assignedAt: new Date(Date.now() - 20 * 60000),
      acceptedAt: new Date(Date.now() - 18 * 60000),
      pickedUpAt: new Date(Date.now() - 12 * 60000),
      currentLocation: {
        lat: 12.9716,
        lng: 77.5946,
        updatedAt: new Date(),
      },
      createdAt: new Date(Date.now() - 20 * 60000),
      updatedAt: new Date(),
    });
  }

  if (deliveredOrderIndex >= 0) {
    await db.collection('deliveryassignments').insertOne({
      orderId: orderIds[deliveredOrderIndex],
      deliveryStaffId: deliveryStaff1Id,
      deliveryStaffName: 'Santosh Kumar',
      deliveryStaffPhone: '+91 98000 33333',
      status: 'DELIVERED',
      deliveryOtp: '7192',
      otpVerified: true,
      assignedAt: new Date(Date.now() - 70 * 60000),
      acceptedAt: new Date(Date.now() - 68 * 60000),
      pickedUpAt: new Date(Date.now() - 65 * 60000),
      deliveredAt: new Date(Date.now() - 35 * 60000),
      createdAt: new Date(Date.now() - 70 * 60000),
      updatedAt: new Date(Date.now() - 35 * 60000),
    });
  }

  console.log('✅ Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Credentials Summary:');
  console.log('👑 Admin:    admin@cloudkitchen.com    / Admin@123');
  console.log('👨‍🍳 Kitchen:  kitchen@cloudkitchen.com  / Kitchen@123');
  console.log('🛵 Delivery: delivery@cloudkitchen.com / Delivery@123 (Santosh Kumar)');
  console.log('🛵 Delivery: rider2@cloudkitchen.com   / Delivery@123 (Amit Verma)');
  console.log('👤 Customer: customer@cloudkitchen.com / Customer@123 (Ananya Deshmukh)');
  console.log('🎟️ Coupons:   WELCOME50, TASTY20, FLAT100, CHEFSPECIAL');
  console.log('--------------------------------------------------');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
