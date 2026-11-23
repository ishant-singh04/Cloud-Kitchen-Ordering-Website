'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  Package,
  Tag,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X,
  Check,
  Percent,
  Banknote,
  Flame,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'menu' | 'delivery' | 'inventory' | 'coupons' | 'settings'
  >('overview');

  const [isLoading, setIsLoading] = useState(true);

  // Analytics Data
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [assigningOrder, setAssigningOrder] = useState<any>(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  // Menu & Categories
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 399,
    categoryId: '',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
    isVeg: true,
    isBestseller: false,
    prepTimeMinutes: 20,
    stockCount: 50,
  });

  // Delivery Fleet
  const [deliveryStaff, setDeliveryStaff] = useState<any[]>([]);
  const [showAddRiderModal, setShowAddRiderModal] = useState(false);
  const [newRider, setNewRider] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'Bike',
    vehicleNumber: '',
  });

  // Inventory
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [showRestockModal, setShowRestockModal] = useState<any>(null);
  const [restockAmount, setRestockAmount] = useState<number>(5);

  // Coupons
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 299,
    maxDiscountAmount: 100,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  // Settings
  const [restaurantSettings, setRestaurantSettings] = useState<any>(null);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState('');

  // Fetch all core datasets
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, ordersRes, productsRes, categoriesRes, staffRes, inventoryRes, couponsRes, settingsRes] =
        await Promise.all([
          fetch('/api/analytics').then((r) => r.json()),
          fetch('/api/orders?limit=100').then((r) => r.json()),
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json()),
          fetch('/api/delivery/staff').then((r) => r.json()),
          fetch('/api/inventory').then((r) => r.json()),
          fetch('/api/coupons').then((r) => r.json()),
          fetch('/api/settings').then((r) => r.json()),
        ]);

      if (analyticsRes.success) {
        setMetrics(analyticsRes.metrics);
        setCharts(analyticsRes.charts);
      }
      if (ordersRes.success) setOrders(ordersRes.orders);
      if (productsRes.success) setProducts(productsRes.products);
      if (categoriesRes.success) {
        setCategories(categoriesRes.categories);
        if (categoriesRes.categories.length > 0 && !newProduct.categoryId) {
          setNewProduct((prev) => ({ ...prev, categoryId: categoriesRes.categories[0]._id }));
        }
      }
      if (staffRes.success) setDeliveryStaff(staffRes.staff);
      if (inventoryRes.success) setIngredients(inventoryRes.ingredients);
      if (couponsRes.success) setCoupons(couponsRes.coupons);
      if (settingsRes.success) setRestaurantSettings(settingsRes.settings);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handler: Assign Delivery Rider
  const handleAssignRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrder || !selectedRiderId) return;

    try {
      const res = await fetch('/api/delivery/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: assigningOrder._id,
          deliveryStaffId: selectedRiderId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setAssigningOrder(null);
        setSelectedRiderId('');
        fetchAllData();
      } else {
        alert(data.error || 'Failed to assign rider');
      }
    } catch (err: any) {
      alert(err.message || 'Error assigning rider');
    }
  };

  // Handler: Add Delivery Rider
  const handleAddRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/delivery/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRider),
      });
      const data = await res.json();
      if (data.success) {
        alert('Rider added successfully');
        setShowAddRiderModal(false);
        setNewRider({
          name: '',
          email: '',
          phone: '',
          password: '',
          vehicleType: 'Bike',
          vehicleNumber: '',
        });
        fetchAllData();
      } else {
        alert(data.error || 'Failed to add rider');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding rider');
    }
  };

  // Handler: Add Product
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          slug: newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Product added to menu');
        setShowAddProductModal(false);
        fetchAllData();
      } else {
        alert(data.error || 'Failed to add product');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding product');
    }
  };

  // Handler: Restock Ingredient
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRestockModal) return;
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: showRestockModal._id,
          changeType: 'restock',
          quantity: Number(restockAmount),
          notes: 'Admin manual restock',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRestockModal(null);
        fetchAllData();
      } else {
        alert(data.error || 'Restock failed');
      }
    } catch (err: any) {
      alert(err.message || 'Restock error');
    }
  };

  // Handler: Add Coupon
  const handleAddCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon),
      });
      const data = await res.json();
      if (data.success) {
        alert('Coupon created successfully');
        setShowAddCouponModal(false);
        fetchAllData();
      } else {
        alert(data.error || 'Failed to create coupon');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating coupon');
    }
  };

  // Handler: Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurantSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSavedMessage('Restaurant settings updated successfully!');
        setTimeout(() => setSettingsSavedMessage(''), 3000);
      }
    } catch (e: any) {
      alert('Failed to save settings');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchCust = o.customerName.toLowerCase().includes(q);
      return matchNum || matchCust;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-stone-900 border-r border-stone-800 flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black shadow-md shadow-orange-600/30">
              CK
            </div>
            <div>
              <span className="text-base font-black text-white tracking-tight">
                CloudKitchen<span className="text-orange-500">PRO</span>
              </span>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                Admin Management HQ
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders Manager</span>
              </div>
              {metrics?.ordersAwaitingAssignment > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black">
                  {metrics.ordersAwaitingAssignment}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'menu'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Menu & Categories</span>
            </button>

            <button
              onClick={() => setActiveTab('delivery')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'delivery'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>In-House Fleet</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'inventory'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory Stock</span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'coupons'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Coupons & Offers</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Restaurant Settings</span>
            </button>
          </nav>
        </div>

        {/* User Info & Switchers */}
        <div className="pt-6 border-t border-stone-800 space-y-3">
          <div className="flex items-center justify-between text-xs px-2">
            <div>
              <p className="font-bold text-white">{user?.name || 'Vikram Mehta'}</p>
              <p className="text-[10px] text-stone-500 uppercase">Administrator</p>
            </div>
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white"
              title="Storefront"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-2">
            <Link
              href="/kitchen"
              className="flex-1 text-center py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold"
            >
              Kitchen KDS
            </Link>
            <Link
              href="/delivery"
              className="flex-1 text-center py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 text-[11px] font-bold border border-emerald-800"
            >
              Rider Portal
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Admin Workspace Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 max-h-screen">
        {/* Top Operational Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight capitalize">
              {activeTab === 'overview'
                ? 'Business Performance & Analytics'
                : activeTab === 'orders'
                ? 'Live Order Management'
                : activeTab === 'menu'
                ? 'Menu & Recipe Builder'
                : activeTab === 'delivery'
                ? 'In-House Delivery Fleet'
                : activeTab === 'inventory'
                ? 'Ingredient-Level Inventory'
                : activeTab === 'coupons'
                ? 'Discount Coupons & Promos'
                : 'Single Restaurant Configuration'}
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Data synchronized directly with MongoDB database
            </p>
          </div>

          <button
            onClick={fetchAllData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>

        {/* 1. OVERVIEW & ANALYTICS TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Total Gross Revenue
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  ₹{metrics?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Real DB Aggregation</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Today&apos;s Revenue
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-400">
                  ₹{metrics?.todayRevenue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-stone-400">
                  {metrics?.todayOrdersCount || 0} orders placed today
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Average Order Value
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  ₹{metrics?.averageOrderValue || 0}
                </p>
                <p className="text-xs text-stone-400">Per paying transaction</p>
              </div>

              <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Active Delivery Fleet
                </span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {metrics?.activeDeliveryPersonnel || 0} Online
                </p>
                <p className="text-xs text-stone-400">
                  {metrics?.ordersAwaitingAssignment || 0} orders awaiting dispatch
                </p>
              </div>
            </div>

            {/* Daily Sales Table / Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Daily Sales Bar */}
              <div className="lg:col-span-7 bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4">
                <h3 className="text-base font-black text-white">Last 7 Days Revenue Trend</h3>
                <div className="space-y-3">
                  {charts?.dailyRevenue?.map((d: any, idx: number) => {
                    const maxRev = Math.max(...charts.dailyRevenue.map((r: any) => r.revenue), 100);
                    const pct = Math.min(100, (d.revenue / maxRev) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-stone-300 font-semibold">
                          <span>{d.date}</span>
                          <span>₹{d.revenue} ({d.orders} orders)</span>
                        </div>
                        <div className="h-3 rounded-full bg-stone-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, pct)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Selling Food Items */}
              <div className="lg:col-span-5 bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4">
                <h3 className="text-base font-black text-white">Popular Dishes by Volume</h3>
                <div className="space-y-3">
                  {charts?.popularDishes?.map((dish: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-stone-800/60 border border-stone-700/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-orange-600/20 text-orange-400 font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white line-clamp-1">{dish.name}</p>
                          <p className="text-[11px] text-stone-400">{dish.quantity} portions ordered</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-400">₹{dish.revenue.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ORDERS MANAGEMENT TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order # or customer..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Status Select */}
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="py-2.5 px-3 rounded-xl bg-stone-900 border border-stone-800 text-xs font-bold text-stone-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Orders Table */}
            <div className="bg-stone-900 rounded-3xl border border-stone-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-800/80 text-stone-400 uppercase font-black tracking-wider border-b border-stone-700/60">
                    <tr>
                      <th className="p-4">Order #</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Items</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Delivery Staff</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800 text-stone-300">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-stone-800/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-white">#{order.orderNumber}</td>
                        <td className="p-4">
                          <p className="font-bold text-white">{order.customerName}</p>
                          <p className="text-[10px] text-stone-500">{order.customerPhone}</p>
                        </td>
                        <td className="p-4 text-stone-400">
                          {order.items?.length || 0} items
                        </td>
                        <td className="p-4 font-bold text-white">₹{order.totalAmount}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              order.paymentStatus === 'completed'
                                ? 'bg-emerald-950 text-emerald-400'
                                : 'bg-amber-950 text-amber-400'
                            }`}
                          >
                            {order.paymentMethod} • {order.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-stone-800 text-stone-200">
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          {order.deliveryStaffName ? (
                            <span className="text-emerald-400 font-semibold">
                              🛵 {order.deliveryStaffName}
                            </span>
                          ) : (
                            <span className="text-stone-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedOrderDetails(order)}
                            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px]"
                          >
                            View
                          </button>
                          {['READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED'].includes(order.status) && (
                            <button
                              onClick={() => {
                                setAssigningOrder(order);
                                setSelectedRiderId('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                            >
                              Assign Rider
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. MENU BUILDER TAB */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Menu Products ({products.length})</h3>
                <p className="text-xs text-stone-400">
                  Manage categories, items, prices, dietary badges, and stock
                </p>
              </div>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div
                  key={prod._id}
                  className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden flex flex-col justify-between"
                >
                  <div className="aspect-[16/10] bg-stone-800 relative">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                      {prod.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-white text-sm line-clamp-1">{prod.name}</h4>
                      <span className="font-black text-orange-400">₹{prod.price}</span>
                    </div>
                    <p className="text-xs text-stone-400 line-clamp-2">{prod.description}</p>
                    <div className="flex items-center justify-between pt-2 text-[11px] text-stone-500 border-t border-stone-800">
                      <span>Stock: {prod.stockCount}</span>
                      <span>Prep: {prod.prepTimeMinutes}m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. IN-HOUSE DELIVERY FLEET TAB */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">In-House Delivery Riders ({deliveryStaff.length})</h3>
                <p className="text-xs text-stone-400">
                  Manage restaurant&apos;s own delivery staff, vehicles, and active assignments
                </p>
              </div>
              <button
                onClick={() => setShowAddRiderModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Delivery Rider</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deliveryStaff.map((rider) => (
                <div
                  key={rider._id}
                  className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold">
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-sm">{rider.name}</h4>
                        <p className="text-xs text-stone-400">{rider.phone}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        rider.isAvailable
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-stone-800 text-stone-500'
                      }`}
                    >
                      {rider.isAvailable ? 'Available' : 'Busy'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-800/60 text-xs space-y-1 text-stone-300">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Vehicle:</span>
                      <span className="font-bold">{rider.vehicleType} • {rider.vehicleNumber || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Deliveries Completed:</span>
                      <span className="font-bold text-emerald-400">{rider.totalDeliveriesCompleted || 0}</span>
                    </div>
                  </div>

                  {rider.activeAssignment && (
                    <div className="p-2.5 rounded-xl bg-orange-950/60 border border-orange-800 text-xs text-orange-200">
                      Active: #{rider.activeAssignment.orderId?.orderNumber} ({rider.activeAssignment.status})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Ingredient Inventory ({ingredients.length})</h3>
                <p className="text-xs text-stone-400">
                  Real-time stock deduction on cooking and automatic restoration on cancellation
                </p>
              </div>
            </div>

            <div className="bg-stone-900 rounded-3xl border border-stone-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-800/80 text-stone-400 uppercase font-black tracking-wider border-b border-stone-700/60">
                  <tr>
                    <th className="p-4">Ingredient</th>
                    <th className="p-4">Current Stock</th>
                    <th className="p-4">Unit</th>
                    <th className="p-4">Low Stock Warning Threshold</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800 text-stone-300">
                  {ingredients.map((ing) => {
                    const isLow = ing.currentStock <= ing.lowStockThreshold;
                    return (
                      <tr key={ing._id} className="hover:bg-stone-800/40">
                        <td className="p-4 font-bold text-white">{ing.name}</td>
                        <td className="p-4 font-mono font-black text-sm">
                          {ing.currentStock} {ing.unit}
                        </td>
                        <td className="p-4 text-stone-400">{ing.unit}</td>
                        <td className="p-4 text-stone-400">{ing.lowStockThreshold} {ing.unit}</td>
                        <td className="p-4">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-950 text-rose-400 border border-rose-800 animate-pulse">
                              Low Stock Warning
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400">
                              Adequate
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setShowRestockModal(ing);
                              setRestockAmount(5);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
                          >
                            + Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. COUPONS TAB */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Discount Coupons ({coupons.length})</h3>
                <p className="text-xs text-stone-400">
                  Configure promo codes, usage limits, and minimum spend rules
                </p>
              </div>
              <button
                onClick={() => setShowAddCouponModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <div
                  key={coupon._id}
                  className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-base text-orange-400 bg-stone-950 px-3 py-1 rounded-xl border border-stone-800">
                      {coupon.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}% OFF`
                        : `₹${coupon.discountValue} FLAT`}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300">{coupon.description}</p>

                  <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 space-y-1">
                    <p>Min Order: ₹{coupon.minOrderAmount || 0}</p>
                    <p>Usage: {coupon.usedCount || 0} / {coupon.totalUsageLimit || 1000}</p>
                    <p>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. SETTINGS TAB */}
        {activeTab === 'settings' && restaurantSettings && (
          <form onSubmit={handleSaveSettings} className="max-w-2xl bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-800 space-y-6">
            <h3 className="text-lg font-black text-white">Single Restaurant Business Settings</h3>

            {settingsSavedMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold">
                {settingsSavedMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-stone-400 font-bold mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={restaurantSettings.name || ''}
                  onChange={(e) =>
                    setRestaurantSettings({ ...restaurantSettings, name: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={restaurantSettings.phone || ''}
                  onChange={(e) =>
                    setRestaurantSettings({ ...restaurantSettings, phone: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-stone-400 font-bold mb-1">Cloud Kitchen Address</label>
              <input
                type="text"
                value={restaurantSettings.address || ''}
                onChange={(e) =>
                  setRestaurantSettings({ ...restaurantSettings, address: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-stone-400 font-bold mb-1">Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={restaurantSettings.deliveryFee || 0}
                  onChange={(e) =>
                    setRestaurantSettings({
                      ...restaurantSettings,
                      deliveryFee: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Free Delivery Min (₹)</label>
                <input
                  type="number"
                  value={restaurantSettings.minOrderForFreeDelivery || 0}
                  onChange={(e) =>
                    setRestaurantSettings({
                      ...restaurantSettings,
                      minOrderForFreeDelivery: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">GST Tax Rate (%)</label>
                <input
                  type="number"
                  value={restaurantSettings.taxRatePercentage || 0}
                  onChange={(e) =>
                    setRestaurantSettings({
                      ...restaurantSettings,
                      taxRatePercentage: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">Min Order (₹)</label>
                <input
                  type="number"
                  value={restaurantSettings.minOrderAmount || 0}
                  onChange={(e) =>
                    setRestaurantSettings({
                      ...restaurantSettings,
                      minOrderAmount: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>
            </div>

            {/* Feature Flags */}
            <div className="pt-4 border-t border-stone-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">
                Service Toggles
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-stone-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restaurantSettings.isOnlineOrderingEnabled ?? true}
                    onChange={(e) =>
                      setRestaurantSettings({
                        ...restaurantSettings,
                        isOnlineOrderingEnabled: e.target.checked,
                      })
                    }
                    className="rounded text-orange-600"
                  />
                  <span>Online Ordering Active</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-stone-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restaurantSettings.isKitchenAcceptingOrders ?? true}
                    onChange={(e) =>
                      setRestaurantSettings({
                        ...restaurantSettings,
                        isKitchenAcceptingOrders: e.target.checked,
                      })
                    }
                    className="rounded text-orange-600"
                  />
                  <span>Kitchen Accepting Orders</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-stone-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restaurantSettings.isCodEnabled ?? true}
                    onChange={(e) =>
                      setRestaurantSettings({
                        ...restaurantSettings,
                        isCodEnabled: e.target.checked,
                      })
                    }
                    className="rounded text-orange-600"
                  />
                  <span>Cash on Delivery (COD) Enabled</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-stone-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restaurantSettings.isOnlinePaymentEnabled ?? true}
                    onChange={(e) =>
                      setRestaurantSettings({
                        ...restaurantSettings,
                        isOnlinePaymentEnabled: e.target.checked,
                      })
                    }
                    className="rounded text-orange-600"
                  />
                  <span>Online Payments (Razorpay) Enabled</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
            >
              Save Configuration
            </button>
          </form>
        )}
      </main>

      {/* Assign Rider Modal */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-black text-white">
              Assign Rider to Order #{assigningOrder.orderNumber}
            </h3>
            <p className="text-xs text-stone-400">
              Select an available in-house delivery rider to dispatch this order.
            </p>

            <form onSubmit={handleAssignRiderSubmit} className="space-y-4">
              <select
                required
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
                className="w-full p-3 rounded-xl bg-stone-800 border border-stone-700 text-xs text-white"
              >
                <option value="">-- Select In-House Rider --</option>
                {deliveryStaff.map((rider) => (
                  <option key={rider._id} value={rider._id}>
                    {rider.name} ({rider.isAvailable ? 'Available' : 'Busy'}) • {rider.vehicleType}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedRiderId}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs disabled:opacity-40"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Rider Modal */}
      {showAddRiderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-black text-white">Add In-House Delivery Rider</h3>

            <form onSubmit={handleAddRiderSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Rider Full Name</label>
                <input
                  type="text"
                  required
                  value={newRider.name}
                  onChange={(e) => setNewRider({ ...newRider, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newRider.email}
                  onChange={(e) => setNewRider({ ...newRider, email: e.target.value })}
                  placeholder="rider@cloudkitchen.com"
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={newRider.phone}
                  onChange={(e) => setNewRider({ ...newRider, phone: e.target.value })}
                  placeholder="+91 98000 55555"
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newRider.password}
                  onChange={(e) => setNewRider({ ...newRider, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Vehicle Type</label>
                  <select
                    value={newRider.vehicleType}
                    onChange={(e) => setNewRider({ ...newRider, vehicleType: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                  >
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Electric Bike">Electric Bike</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={newRider.vehicleNumber}
                    onChange={(e) => setNewRider({ ...newRider, vehicleNumber: e.target.value })}
                    placeholder="KA-01-AB-1234"
                    className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRiderModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Add Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-black text-white">Restock {showRestockModal.name}</h3>
            <p className="text-xs text-stone-400">
              Current stock: {showRestockModal.currentStock} {showRestockModal.unit}
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Quantity to Add ({showRestockModal.unit})
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(null)}
                  className="flex-1 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-black text-white">
                Order #{selectedOrderDetails.orderNumber} Details
              </h3>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-800/80 space-y-1">
                <p className="font-bold text-white">Customer: {selectedOrderDetails.customerName}</p>
                <p className="text-stone-400">Phone: {selectedOrderDetails.customerPhone}</p>
                <p className="text-stone-400">
                  Address: {selectedOrderDetails.deliveryAddress?.street},{' '}
                  {selectedOrderDetails.deliveryAddress?.city}
                </p>
                {selectedOrderDetails.deliveryOtp && (
                  <p className="text-orange-400 font-bold">
                    Delivery Verification OTP: {selectedOrderDetails.deliveryOtp}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">
                  Ordered Food Items
                </p>
                {selectedOrderDetails.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between py-1 border-b border-stone-800">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-bold text-white">₹{item.itemTotal}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between font-bold text-sm text-white">
                <span>Total Amount:</span>
                <span className="text-orange-400">₹{selectedOrderDetails.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
