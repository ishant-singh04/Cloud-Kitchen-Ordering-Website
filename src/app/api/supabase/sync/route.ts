import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getAuthUserFromRequest } from '@/lib/auth';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Ingredient from '@/models/Ingredient';
import Coupon from '@/models/Coupon';
import RestaurantSettings from '@/models/RestaurantSettings';

/**
 * Syncs existing MongoDB store data to Supabase PostgreSQL database.
 * Admin-only operation.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not configured in environment.' },
        { status: 503 }
      );
    }

    await connectToDatabase();
    const supabase = getSupabaseAdmin();

    const stats = {
      categories: 0,
      products: 0,
      ingredients: 0,
      coupons: 0,
      settings: false,
    };

    // 1. Sync Settings
    const mongoSettings = await RestaurantSettings.findOne().lean();
    if (mongoSettings) {
      await supabase.from('restaurant_settings').upsert({
        name: mongoSettings.name,
        tagline: mongoSettings.tagline,
        description: mongoSettings.description,
        logo: mongoSettings.logo,
        phone: mongoSettings.phone,
        email: mongoSettings.email,
        address: mongoSettings.address,
        opening_time: mongoSettings.openingTime,
        closing_time: mongoSettings.closingTime,
        delivery_fee: mongoSettings.deliveryFee,
        min_order_for_free_delivery: mongoSettings.minOrderForFreeDelivery,
        tax_rate_percentage: mongoSettings.taxRatePercentage,
        is_kitchen_accepting_orders: mongoSettings.isKitchenAcceptingOrders,
        estimated_delivery_time_minutes: mongoSettings.estimatedDeliveryTimeMinutes,
        currency_symbol: mongoSettings.currencySymbol,
      });
      stats.settings = true;
    }

    // 2. Sync Ingredients
    const mongoIngredients = await Ingredient.find().lean();
    for (const ing of mongoIngredients) {
      await supabase.from('ingredients').upsert(
        {
          name: ing.name,
          current_stock: ing.currentStock,
          unit: ing.unit,
          low_stock_threshold: ing.lowStockThreshold,
          cost_per_unit: ing.costPerUnit,
        },
        { onConflict: 'name' }
      );
      stats.ingredients++;
    }

    // 3. Sync Categories
    const mongoCategories = await Category.find().lean();
    const categoryMap = new Map<string, string>(); // mongoId -> supabaseId

    for (const cat of mongoCategories) {
      const { data: supaCat } = await supabase
        .from('categories')
        .upsert(
          {
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            image: cat.image,
            order_index: cat.order || 0,
            is_active: cat.isActive !== undefined ? cat.isActive : true,
          },
          { onConflict: 'slug' }
        )
        .select('id, slug')
        .single();

      if (supaCat) {
        categoryMap.set(cat._id.toString(), supaCat.id);
        stats.categories++;
      }
    }

    // 4. Sync Products
    const mongoProducts = await Product.find().lean();
    for (const prod of mongoProducts) {
      const supaCatId = categoryMap.get(prod.categoryId?.toString());
      if (!supaCatId) continue;

      await supabase.from('products').upsert(
        {
          category_id: supaCatId,
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          price: prod.price,
          original_price: prod.originalPrice || null,
          image: prod.image,
          is_veg: prod.isVeg ?? true,
          is_bestseller: prod.isBestseller ?? false,
          is_available: prod.isAvailable ?? true,
          in_stock: prod.inStock ?? true,
          stock_count: prod.stockCount ?? 999,
          prep_time_minutes: prod.prepTimeMinutes ?? 20,
          calories: prod.calories || null,
          add_ons: (prod.addOns as any) || [],
          rating: prod.rating ?? 4.8,
          num_reviews: prod.numReviews ?? 0,
        },
        { onConflict: 'slug' }
      );
      stats.products++;
    }

    // 5. Sync Coupons
    const mongoCoupons = await Coupon.find().lean();
    for (const coup of mongoCoupons) {
      await supabase.from('coupons').upsert(
        {
          code: coup.code,
          description: coup.description,
          discount_type: coup.discountType,
          discount_value: coup.discountValue,
          min_order_amount: coup.minOrderAmount,
          max_discount_amount: coup.maxDiscountAmount,
          expiry_date: new Date(coup.expiryDate).toISOString(),
          is_active: coup.isActive,
        },
        { onConflict: 'code' }
      );
      stats.coupons++;
    }

    return NextResponse.json({
      success: true,
      message: 'Store data successfully synced to Supabase!',
      synced: stats,
    });
  } catch (error: any) {
    console.error('Supabase sync error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to sync data' }, { status: 500 });
  }
}
