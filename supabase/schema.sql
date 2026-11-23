-- ==============================================================================
-- CloudKitchen Pro - Supabase PostgreSQL Database Schema
-- Single-Restaurant Cloud Kitchen Management, KDS & In-House Delivery Platform
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Restaurant Settings Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'CloudKitchen Pro',
    tagline TEXT DEFAULT 'Artisanal Flavors, Delivered Hot & Fresh',
    description TEXT DEFAULT 'Premier gourmet cloud kitchen delivering chef-curated meals.',
    logo TEXT DEFAULT '/images/logo.png',
    phone TEXT DEFAULT '+91 98765 43210',
    email TEXT DEFAULT 'orders@cloudkitchenpro.com',
    address TEXT DEFAULT 'Indiranagar 100ft Road, Stage 2, Bengaluru, Karnataka 560038',
    opening_time TEXT DEFAULT '10:00 AM',
    closing_time TEXT DEFAULT '11:45 PM',
    weekly_closing_days JSONB DEFAULT '[]'::jsonb,
    default_prep_time_minutes INTEGER DEFAULT 25,
    delivery_fee NUMERIC(10, 2) DEFAULT 40.00,
    min_order_amount NUMERIC(10, 2) DEFAULT 150.00,
    min_order_for_free_delivery NUMERIC(10, 2) DEFAULT 499.00,
    tax_rate_percentage NUMERIC(5, 2) DEFAULT 5.00,
    delivery_radius_km NUMERIC(5, 2) DEFAULT 10.00,
    estimated_delivery_time_minutes INTEGER DEFAULT 35,
    currency_symbol TEXT DEFAULT '₹',
    currency_code TEXT DEFAULT 'INR',
    is_kitchen_accepting_orders BOOLEAN DEFAULT TRUE,
    is_online_ordering_enabled BOOLEAN DEFAULT TRUE,
    is_cod_enabled BOOLEAN DEFAULT TRUE,
    is_online_payment_enabled BOOLEAN DEFAULT TRUE,
    is_delivery_enabled BOOLEAN DEFAULT TRUE,
    is_pickup_enabled BOOLEAN DEFAULT TRUE,
    instagram_url TEXT DEFAULT 'https://instagram.com/cloudkitchenpro',
    facebook_url TEXT DEFAULT 'https://facebook.com/cloudkitchenpro',
    twitter_url TEXT DEFAULT 'https://twitter.com/cloudkitchenpro',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. Users Table (Customer, Admin, Kitchen, Delivery)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'kitchen', 'delivery')),
    addresses JSONB DEFAULT '[]'::jsonb,
    favorites JSONB DEFAULT '[]'::jsonb,
    vehicle_type TEXT DEFAULT 'Bike',
    vehicle_number TEXT DEFAULT '',
    is_available BOOLEAN DEFAULT TRUE,
    active_status TEXT DEFAULT 'active' CHECK (active_status IN ('active', 'inactive')),
    total_deliveries_completed INTEGER DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 4.90,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ==============================================================================
-- 4. Categories Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    image TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(order_index);

-- ==============================================================================
-- 5. Raw Ingredients Table (For inventory deduction & recipes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    current_stock NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
    unit TEXT NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'g', 'l', 'ml', 'pcs')),
    low_stock_threshold NUMERIC(10, 3) NOT NULL DEFAULT 5.000,
    cost_per_unit NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON public.ingredients(name);

-- ==============================================================================
-- 6. Products Table (Menu Items)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10, 2),
    image TEXT NOT NULL,
    is_veg BOOLEAN DEFAULT TRUE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    in_stock BOOLEAN DEFAULT TRUE,
    stock_count INTEGER DEFAULT 999,
    prep_time_minutes INTEGER DEFAULT 20,
    calories INTEGER,
    add_ons JSONB DEFAULT '[]'::jsonb,
    ingredients_needed JSONB DEFAULT '[]'::jsonb,
    rating NUMERIC(3, 2) DEFAULT 4.80,
    num_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_veg ON public.products(is_veg);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products(is_bestseller);

-- ==============================================================================
-- 7. Coupons Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
    max_discount_amount NUMERIC(10, 2) DEFAULT 500.00,
    expiry_date TIMESTAMPTZ NOT NULL,
    total_usage_limit INTEGER DEFAULT 1000,
    used_count INTEGER DEFAULT 0,
    per_customer_limit INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ==============================================================================
-- 8. Orders Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address JSONB NOT NULL,
    delivery_instructions TEXT,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    coupon_code TEXT,
    tax NUMERIC(10, 2) DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'razorpay')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    status_history JSONB DEFAULT '[]'::jsonb,
    estimated_prep_time_minutes INTEGER DEFAULT 20,
    delivery_otp TEXT,
    delivery_staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    delivery_staff_name TEXT,
    delivery_staff_phone TEXT,
    assigned_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failure_reason TEXT,
    kitchen_notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- ==============================================================================
-- 9. Order Items Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    is_veg BOOLEAN DEFAULT TRUE,
    image TEXT,
    selected_add_ons JSONB DEFAULT '[]'::jsonb,
    special_instructions TEXT,
    item_total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ==============================================================================
-- 10. Delivery Assignments Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    delivery_staff_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    delivery_staff_name TEXT NOT NULL,
    delivery_staff_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ASSIGNED',
    delivery_otp TEXT NOT NULL,
    otp_verified BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    notes TEXT,
    current_location JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_order ON public.delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_staff ON public.delivery_assignments(delivery_staff_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON public.delivery_assignments(status);

-- ==============================================================================
-- 11. Inventory Transactions Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('deduction', 'restock', 'adjustment')),
    quantity NUMERIC(10, 3) NOT NULL,
    previous_stock NUMERIC(10, 3) NOT NULL,
    new_stock NUMERIC(10, 3) NOT NULL,
    unit TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    notes TEXT,
    performed_by TEXT DEFAULT 'System',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_txn_ingredient ON public.inventory_transactions(ingredient_id);

-- ==============================================================================
-- 12. Reviews Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);

-- ==============================================================================
-- 13. Notifications Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    target_role TEXT CHECK (target_role IN ('admin', 'kitchen', 'delivery', 'customer')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    reference_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(target_role);

-- ==============================================================================
-- 14. Trigger Function for updated_at Auto-Update
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    -- Add triggers to tables with updated_at column
    CREATE TRIGGER tr_restaurant_settings_updated BEFORE UPDATE ON public.restaurant_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TRIGGER tr_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TRIGGER tr_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TRIGGER tr_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TRIGGER tr_ingredients_updated BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TRIGGER tr_coupons_updated BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TRIGGER tr_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TRIGGER tr_delivery_assignments_updated BEFORE UPDATE ON public.delivery_assignments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 15. Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Public read policies for storefront browsing
CREATE POLICY "Allow public read on restaurant_settings" ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read on active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read on reviews" ON public.reviews FOR SELECT USING (true);

-- Service role bypasses all policies automatically.
-- Full access policy for service role:
CREATE POLICY "Allow service role full access on settings" ON public.restaurant_settings FOR ALL USING (true);
CREATE POLICY "Allow service role full access on categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow service role full access on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow service role full access on ingredients" ON public.ingredients FOR ALL USING (true);
CREATE POLICY "Allow service role full access on coupons" ON public.coupons FOR ALL USING (true);
CREATE POLICY "Allow service role full access on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow service role full access on orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow service role full access on order_items" ON public.order_items FOR ALL USING (true);
CREATE POLICY "Allow service role full access on delivery" ON public.delivery_assignments FOR ALL USING (true);
CREATE POLICY "Allow service role full access on inventory" ON public.inventory_transactions FOR ALL USING (true);
CREATE POLICY "Allow service role full access on reviews" ON public.reviews FOR ALL USING (true);
CREATE POLICY "Allow service role full access on notifications" ON public.notifications FOR ALL USING (true);

-- ==============================================================================
-- 16. Supabase Storage Setup (For Menu Item & Restaurant Images)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('cloudkitchen-assets', 'cloudkitchen-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to uploaded images
CREATE POLICY "Public Assets Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'cloudkitchen-assets');

-- Allow service role or authenticated uploads
CREATE POLICY "Authenticated Assets Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cloudkitchen-assets');
