# CloudKitchen PRO 🍽️
### Single-Restaurant Cloud Kitchen Ordering, Kitchen Operations (KDS) & In-House Delivery Management Platform

**CloudKitchen Pro** is a production-oriented, database-connected Cloud Kitchen Management System designed specifically for a single gourmet restaurant. It unifies high-conversion customer online ordering, real-time Kitchen Operations (KDS) with sound chimes, dedicated In-House Delivery fleet management with **Delivery OTP verification**, dynamic menu and category builders, ingredient-level inventory tracking, coupon engines, and live executive analytics.

---

## 🌟 Key Subsystems & Features

### 1. Single-Restaurant Business Model (Not a Marketplace)
- **Sole Merchant Operating Model**: Dedicated to one restaurant business. Zero vendor commissions, zero multi-restaurant registrations.
- **Dynamic Business Configuration**: Owner-controlled restaurant profile, logo, operating hours, delivery radius, minimum order limits, delivery fee tiers, free delivery thresholds, and service toggles (Online Ordering, Cash on Delivery, Online Payments, Express Delivery).

### 2. Four Independent User Roles & Permissions
- **Admin / Owner**: Complete oversight across business metrics, live orders, menu builder, coupon creation, inventory restock, in-house fleet assignments, and restaurant configuration.
- **Kitchen Staff**: Dedicated touch-friendly Kitchen Display System (KDS) Kanban board. Instant audio chimes on new orders, prep timers, overdue flags, ingredient recipe deductions, and order packaging state transitions.
- **Delivery Staff**: Mobile-first dedicated driver portal. Shift availability toggle, active assignment acceptance, Google Maps routing, customer contact access, live location sharing, and **mandatory 4-digit Delivery OTP verification**.
- **Customer**: Clean gourmet storefront, category browsing, customizations & add-ons, special cooking instructions, persistent cart, coupon discounts, multiple saved addresses, COD or Razorpay checkout, and real-time live order tracking.

### 3. In-House Delivery Management & Secure Delivery OTP
- **Restaurant-Owned Fleet**: Restaurant employs its own delivery riders with registered vehicles (Bikes, Scooters, EVs).
- **Dispatch Workflow**:
  $$\text{ASSIGNED} \longrightarrow \text{ACCEPTED} \longrightarrow \text{PICKED\_UP} \longrightarrow \text{OUT\_FOR\_DELIVERY} \longrightarrow \text{DELIVERED (via OTP)}$$
- **Delivery OTP Security**: A random 4-digit numeric code is generated upon order placement. Displayed prominently on the customer's live tracking screen. The rider must enter and verify this OTP in their portal to mark delivery complete and release their availability.
- **Fail-Safe Exception Handling**: Handled reporting for failed attempts (customer unreachable, invalid address) and admin-authorized overrides.

### 4. Kitchen Operations (KDS) Kanban
- 5-Column Workflow: **New Incoming**, **Confirmed**, **On Stove / Prep**, **Ready For Pickup**, and **Dispatched**.
- Large touch controls for kitchen tablets.
- Synthesized Web Audio API pleasant chimes on incoming orders with a mute/unmute control.
- Overdue timers and visual warnings when preparation exceeds estimated time.

### 5. Ingredient-Level Inventory Management
- Product recipes link directly to raw ingredients (e.g. Basmati Rice, Sourdough Crusts, Truffle Burrata, Mozzarella, Brioche Buns).
- **Automatic Stock Deduction**: Ingredients are deducted safely upon kitchen confirmation/preparation.
- **Automatic Restoration**: When an order is cancelled or rejected, deducted inventory is automatically restored and audited.
- **Low-Stock Alerting**: Highlights ingredients dropping below custom reorder thresholds.

### 6. Indian Payments & Razorpay Integration
- **Razorpay Online Payments**: UPI, Credit/Debit Cards, NetBanking, and Wallets with server-side HMAC SHA256 signature verification.
- **Cash on Delivery (COD)**: Supports cash payment on arrival with automatic completion updates upon OTP verification.
- Seamless test mode simulation when evaluating with development keys.

---

## 🚀 Quick Start & Development Setup

### Prerequisites
- **Node.js** (v18.x or v20.x+)
- **MongoDB** (Local instance or MongoDB Atlas connection string)
- **npm** or **pnpm**

### 1. Installation
Clone or navigate to the project directory:
```bash
cd "Cloud Kitchen Ordering Website"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Key configuration items:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/cloudkitchen_pro
JWT_SECRET=super_secret_jwt_key_cloudkitchen_pro_2025_secure_token
RAZORPAY_KEY_ID=rzp_test_mock_cloudkitchen123
RAZORPAY_KEY_SECRET=secret_test_mock_cloudkitchen456
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_mock_cloudkitchen123

# Supabase (PostgreSQL & Storage)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_STORAGE_BUCKET=cloudkitchen-assets
```

### 3. Seed Database with Realistic Indian Cloud Kitchen Data
Execute the seed script to populate realistic Indian gourmet categories, dishes, ingredients, discount coupons, and all 4 user roles:
```bash
# For MongoDB:
npm run seed

# For Supabase (PostgreSQL):
npm run seed:supabase
```
*(For complete Supabase setup and schema execution guide, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md))*

### 4. Start the Application
Run the persistent custom HTTP + Socket.IO server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Pre-Seeded Demo Credentials

For quick evaluation, 1-click login buttons are available on the `/login` page, or you can enter these credentials directly:

| Role | Name | Email | Password | Dedicated URL |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin / Owner** | Vikram Mehta | `admin@cloudkitchen.com` | `Admin@123` | `/admin` |
| **👨‍🍳 Head Chef** | Chef Rajesh Sharma | `kitchen@cloudkitchen.com` | `Kitchen@123` | `/kitchen` |
| **🛵 Delivery Rider 1** | Santosh Kumar | `delivery@cloudkitchen.com` | `Delivery@123` | `/delivery` |
| **🛵 Delivery Rider 2** | Amit Verma | `rider2@cloudkitchen.com` | `Delivery@123` | `/delivery` |
| **👤 Customer** | Ananya Deshmukh | `customer@cloudkitchen.com` | `Customer@123` | `/menu` & `/profile` |

### 🎟️ Promo Discount Codes
- `WELCOME50` - 50% discount on first orders (up to ₹100)
- `FLAT100` - Flat ₹100 off on orders above ₹499
- `TASTY20` - 20% discount on orders above ₹399

---

## 🏗️ Technology Architecture

```
CloudKitchen Pro
├── src/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── (storefront)/page.tsx   # Customer Homepage & Branding
│   │   ├── menu/page.tsx           # Interactive Menu & Customizer
│   │   ├── checkout/page.tsx       # Address & Razorpay/COD Checkout
│   │   ├── orders/[id]/page.tsx    # Live Tracking & Delivery OTP Screen
│   │   ├── profile/page.tsx        # Customer Profile & Past Receipts
│   │   ├── kitchen/page.tsx        # KDS Kitchen Operations Kanban
│   │   ├── delivery/page.tsx       # In-House Delivery Rider Console
│   │   ├── admin/page.tsx          # Executive Business & Fleet HQ
│   │   ├── login/ & register/      # Role-based Authentication
│   │   └── api/                    # RESTful Endpoints
│   │       ├── analytics/          # Business KPI aggregations
│   │       ├── auth/               # JWT & bcrypt sessions
│   │       ├── delivery/           # Staff, assignments, OTP & location
│   │       ├── inventory/          # Recipes, stocks & auto-deduction
│   │       ├── orders/             # Order creation & status history
│   │       ├── payment/            # Razorpay orders & verification
│   │       └── settings/           # Single-restaurant configuration
│   ├── components/                 # Navbar, Footer, CartDrawer, AppShell
│   ├── context/                    # AuthContext & CartContext
│   ├── hooks/                      # useSocket for WebSockets
│   ├── lib/                        # db connection, auth tokens, socket-emitter
│   └── models/                     # Mongoose Schemas (User, Order, Assignment, etc.)
├── scripts/
│   └── seed.mjs                    # Full database seeder
└── server.mjs                      # Node.js + persistent Socket.IO server
```

---

## 🚢 Production Deployment

CloudKitchen Pro uses a decoupled architecture designed for persistent WebSocket support:

### Option A: Standard Full-Stack Host (Render, Railway, DigitalOcean, VPS)
1. Set Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `PORT`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
2. Build command:
   ```bash
   npm run build
   ```
3. Start command:
   ```bash
   node server.mjs
   ```
   *Note: `server.mjs` handles both Next.js request serving and persistent Socket.IO connections on the same port.*

### Option B: Separate Frontend (Vercel) & Backend (Render/Railway)
1. **Frontend**: Deploy the Next.js app to Vercel with `NEXT_PUBLIC_APP_URL` pointing to your backend URL.
2. **Backend**: Host `server.mjs` on Render/Railway with persistent WebSockets enabled.
3. Configure CORS in `server.mjs` to match the frontend Vercel domain.

---

## 🔒 Security Measures
- **HTTP-Only Cookies & Bearer Tokens**: Session tokens are isolated from client script execution.
- **Server-Side Price Recalculation**: Order amounts and discounts are computed strictly from database records.
- **Role-Based API Protection**: Strict server-side route guards prevent cross-role data leaks (riders access only their assigned orders; kitchen cannot view financial secrets; customers see only their own purchases).
- **HMAC Signature Verification**: Razorpay payment signatures are validated using SHA-256 before capturing orders.
- **Secure 4-Digit Delivery OTP**: Prohibits fraudulent delivery completion without customer handover verification.
