# Supabase Integration Guide for CloudKitchen Pro 🍽️⚡

CloudKitchen Pro now includes first-class integration with **Supabase** for storing your cloud kitchen's data (PostgreSQL database) and store assets (Supabase Storage buckets for dish photography, logos, and banners).

---

## 🚀 4-Step Quick Setup

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create or sign in to your account.
2. Click **New Project** and choose a project name (e.g. `cloudkitchen-pro`), database password, and region.

### Step 2: Run the Database Schema
1. Open your Supabase Dashboard and click on the **SQL Editor** in the left sidebar.
2. Click **New query**, open [supabase/schema.sql](file:///Users/madhavkumar/Downloads/Cloud%20Kitchen%20Ordering%20Website/supabase/schema.sql) in this repository, paste the entire SQL content, and click **Run**.
3. This creates:
   - **12 Database Tables**: `restaurant_settings`, `users`, `categories`, `products`, `ingredients`, `coupons`, `orders`, `order_items`, `delivery_assignments`, `inventory_transactions`, `reviews`, and `notifications`.
   - **Automatic Timestamp Triggers**: Keeps `updated_at` timestamps in sync.
   - **Row Level Security (RLS)**: Public read policies for menu browsing and secure policies for customer & rider actions.
   - **Storage Bucket**: Configures the `cloudkitchen-assets` public bucket for dish photos and restaurant assets.

### Step 3: Configure Environment Variables
In your project's `.env.local` file (and `.env`), add your Supabase credentials found in **Project Settings -> API**:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>
SUPABASE_STORAGE_BUCKET=cloudkitchen-assets
```

### Step 4: Seed Initial Store Data
Run the automated Supabase seeder to populate realistic gourmet dishes, categories, ingredients, coupons, demo users, and sample orders:

```bash
npm run seed:supabase
```

---

## 📦 What Was Added

### 1. Supabase Client & SDK (`src/lib/supabase/`)
- [client.ts](file:///Users/madhavkumar/Downloads/Cloud%20Kitchen%20Ordering%20Website/src/lib/supabase/client.ts): Client-side Supabase client for browser components using the anonymous key.
- [admin.ts](file:///Users/madhavkumar/Downloads/Cloud%20Kitchen%20Ordering%20Website/src/lib/supabase/admin.ts): Server-side Supabase client using the `service_role` key to bypass RLS for trusted backend operations.
- [types.ts](file:///Users/madhavkumar/Downloads/Cloud%20Kitchen%20Ordering%20Website/src/lib/supabase/types.ts): Full TypeScript type definitions for all tables, columns, inserts, and updates.
- [storage.ts](file:///Users/madhavkumar/Downloads/Cloud%20Kitchen%20Ordering%20Website/src/lib/supabase/storage.ts): Storage helpers (`uploadStoreFile`, `getStoreFileUrl`, `deleteStoreFile`, `listStoreFiles`).

### 2. Service Layer (`src/lib/supabase/services/`)
- **`categoryService`**: List active categories, fetch by slug, create, and update categories.
- **`productService`**: Filter products (by category, veg/non-veg, bestseller, search, price sorting), get product details, and manage menu items.
- **`orderService`**: Place new orders, fetch customer/kitchen orders, transition status (`CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`), and verify the **4-digit Delivery OTP**.
- **`inventoryService`**: Track raw ingredient stocks, execute deductions/restocks, and view inventory audit logs.
- **`couponService`**: Validate discount codes (`WELCOME50`, `TASTY20`, `FLAT100`, `CHEFSPECIAL`) and enforce minimum order amounts and maximum discount caps.
- **`restaurantService`**: Fetch and update cloud kitchen profile, operating hours, delivery fees, and order toggles.
- **`userService`**: Manage customer profiles, delivery staff rosters, and authentication records.

### 3. API Endpoints
- **`POST /api/upload`**: Upload dish images directly to Supabase Storage and get a CDN URL.
- **`GET /api/supabase/status`**: Check database connection, row counts, and storage bucket health.
- **`POST /api/supabase/sync`**: One-click sync from existing MongoDB data to Supabase (Admin role required).

---

## 🔑 Demo Credentials (Pre-configured in Seeder)

| Role | Email | Password | Dedicated Portal |
| :--- | :--- | :--- | :--- |
| **👑 Admin / Owner** | `admin@cloudkitchen.com` | `Admin@123` | `/admin` |
| **👨‍🍳 Head Chef (KDS)** | `kitchen@cloudkitchen.com` | `Kitchen@123` | `/kitchen` |
| **🛵 Delivery Rider 1** | `delivery@cloudkitchen.com` | `Delivery@123` | `/delivery` |
| **🛵 Delivery Rider 2** | `rider2@cloudkitchen.com` | `Delivery@123` | `/delivery` |
| **👤 Customer** | `customer@cloudkitchen.com` | `Customer@123` | `/menu` |
