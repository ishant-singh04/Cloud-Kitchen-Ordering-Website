'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import {
  ChefHat,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  Star,
  Flame,
  CheckCircle2,
  Phone,
  MapPin,
  Plus,
  Percent,
  Copy,
  Check,
  Heart,
} from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  isVeg: boolean;
  isBestseller: boolean;
  prepTimeMinutes: number;
  calories?: number;
  rating: number;
  numReviews: number;
  addOns?: { name: string; price: number }[];
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

interface RestaurantSettings {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  address: string;
  openingTime: string;
  closingTime: string;
  isKitchenAcceptingOrders: boolean;
  isOnlineOrderingEnabled: boolean;
  minOrderForFreeDelivery: number;
  deliveryFee: number;
}

export default function HomePage() {
  const { addToCart, setIsCartOpen } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: number }[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Fetch initial homepage data
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) setSettings(data.settings);
      })
      .catch(console.error);

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.categories) setCategories(data.categories);
      })
      .catch(console.error);

    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.products) {
          const popular = data.products.filter((p: Product) => p.isBestseller).slice(0, 6);
          setBestsellers(popular.length > 0 ? popular : data.products.slice(0, 6));
        }
      })
      .catch(console.error);
  }, []);

  const handleOpenCustomize = (product: Product) => {
    setSelectedProduct(product);
    setSelectedAddOns([]);
    setSpecialInstructions('');
    setQuantity(1);
  };

  const handleToggleAddOn = (addon: { name: string; price: number }) => {
    if (selectedAddOns.some((a) => a.name === addon.name)) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const handleAddToCartConfirm = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, quantity, selectedAddOns, specialInstructions);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const isKitchenOpen =
    settings?.isKitchenAcceptingOrders !== false && settings?.isOnlineOrderingEnabled !== false;

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/70 via-stone-50 to-white pt-10 pb-16 sm:pb-24">
        {/* Decorative blur spheres */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-amber-300/20 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-200 shadow-sm text-xs font-semibold text-stone-800">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isKitchenOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                ></span>
                <span>
                  {isKitchenOpen
                    ? 'Kitchen Live • Express 30m In-House Delivery'
                    : 'Kitchen Currently Closed for Orders'}
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-orange-600 font-bold">100% In-House Fleet</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]">
                Artisanal Flavors,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                  Delivered Hot
                </span>{' '}
                to Your Doorstep.
              </h1>

              <p className="text-lg sm:text-xl text-stone-600 max-w-2xl leading-relaxed">
                Handcrafted sourdough pizzas, slow-dum aromatic biryanis, gourmet smash burgers, and decadent desserts curated by Master Chefs and delivered by our own dedicated fleet.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/menu"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-base shadow-lg shadow-orange-600/30 hover:scale-[1.02] transition-all"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Order Now</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <a
                  href="#offers"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-base border border-stone-200/90 shadow-sm transition-all"
                >
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Special Offers</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-stone-200/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <div className="flex items-center justify-center lg:justify-start gap-1 text-amber-500 font-black text-xl">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span>4.9 / 5</span>
                  </div>
                  <p className="text-xs text-stone-500 font-medium">Customer Rating</p>
                </div>
                <div>
                  <p className="text-xl font-black text-stone-900">30 Min</p>
                  <p className="text-xs text-stone-500 font-medium">Average Delivery</p>
                </div>
                <div>
                  <p className="text-xl font-black text-stone-900">100%</p>
                  <p className="text-xs text-stone-500 font-medium">Fresh Ingredients</p>
                </div>
              </div>
            </div>

            {/* Right Hero Image Collage */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] bg-stone-100">
                  <img
                    src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop"
                    alt="Artisanal Pizza"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="px-2.5 py-1 rounded-lg bg-orange-600 text-white text-xs font-bold uppercase tracking-wider">
                      Chef Special
                    </span>
                    <h3 className="text-xl font-bold mt-1">Truffle Burrata Sourdough Pizza</h3>
                    <p className="text-xs text-stone-200 mt-0.5">Woodfired with San Marzano tomatoes</p>
                  </div>
                </div>

                {/* Floating Card */}
                <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-stone-200/80 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">FSSAI Certified Cloud Kitchen</p>
                    <p className="text-[11px] text-stone-500">Contactless sanitized prep & packing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES BROWSE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Explore Our <span className="text-orange-600">Kitchen Brands</span>
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Select a culinary category to discover crafted gourmet specialties
            </p>
          </div>
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/menu?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-white border border-stone-200/80 shadow-sm hover:shadow-md transition-all p-3 text-center flex flex-col items-center hover:-translate-y-1"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden mb-3 bg-stone-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. BESTSELLERS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
              <Flame className="w-4 h-4" />
              <span>Customer Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
              Most Ordered Delicacies
            </h2>
          </div>
          <Link
            href="/menu"
            className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>See All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {bestsellers.map((product) => (
            <div
              key={product._id}
              className="group rounded-3xl bg-white border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Product Image */}
              <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Veg / Non-Veg Tag */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md shadow-sm flex items-center gap-1.5 text-[11px] font-bold">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      product.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  ></span>
                  <span className={product.isVeg ? 'text-emerald-800' : 'text-rose-800'}>
                    {product.isVeg ? 'Veg' : 'Non-Veg'}
                  </span>
                </div>

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                </div>
              </div>

              {/* Product Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {product.prepTimeMinutes} mins
                    </span>
                    {product.calories && <span>• {product.calories} kcal</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-stone-900">
                        ₹{product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs line-through text-stone-400">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenCustomize(product)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white font-bold text-xs border border-orange-200 transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SPECIAL OFFERS & COUPONS */}
      <section id="offers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl mb-8">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              Limited Time Deals
            </span>
            <h2 className="text-3xl font-black tracking-tight mt-3 text-white">
              Savor Discounts on Every Single Order
            </h2>
            <p className="text-sm text-stone-300 mt-2">
              Apply these promo codes during checkout for instant reductions on your final bill.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Promo 1 */}
            <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-2xl font-black text-amber-400">50% OFF</span>
                <p className="text-sm font-bold text-white mt-1">Welcome First Order</p>
                <p className="text-xs text-stone-400 mt-1">Up to ₹100 discount on your first order.</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stone-700/80">
                <span className="font-mono font-bold text-sm bg-stone-900 px-3 py-1 rounded-lg text-orange-400 border border-stone-700">
                  WELCOME50
                </span>
                <button
                  onClick={() => copyCouponCode('WELCOME50')}
                  className="flex items-center gap-1 text-xs font-semibold text-stone-300 hover:text-white"
                >
                  {copiedCoupon === 'WELCOME50' ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Promo 2 */}
            <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-2xl font-black text-orange-400">₹100 FLAT</span>
                <p className="text-sm font-bold text-white mt-1">Weekend Feast Deal</p>
                <p className="text-xs text-stone-400 mt-1">Flat ₹100 discount on orders above ₹499.</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stone-700/80">
                <span className="font-mono font-bold text-sm bg-stone-900 px-3 py-1 rounded-lg text-orange-400 border border-stone-700">
                  FLAT100
                </span>
                <button
                  onClick={() => copyCouponCode('FLAT100')}
                  className="flex items-center gap-1 text-xs font-semibold text-stone-300 hover:text-white"
                >
                  {copiedCoupon === 'FLAT100' ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Promo 3 */}
            <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-2xl font-black text-emerald-400">20% OFF</span>
                <p className="text-sm font-bold text-white mt-1">Chef&apos;s Special Discount</p>
                <p className="text-xs text-stone-400 mt-1">20% off on all items above ₹399.</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stone-700/80">
                <span className="font-mono font-bold text-sm bg-stone-900 px-3 py-1 rounded-lg text-orange-400 border border-stone-700">
                  TASTY20
                </span>
                <button
                  onClick={() => copyCouponCode('TASTY20')}
                  className="flex items-center gap-1 text-xs font-semibold text-stone-300 hover:text-white"
                >
                  {copiedCoupon === 'TASTY20' ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE CLOUDKITCHEN PRO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">
            The Modern <span className="text-orange-600">Cloud Kitchen Experience</span>
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            Engineered from ground up to deliver restaurant-quality gastronomic experiences straight to your table.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center font-bold">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900">Master Chef Curated</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Every recipe is perfected with authentic regional spices and slow fermentation techniques.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900">Dedicated In-House Fleet</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              No third-party delays. Our own delivery staff transports food in insulated thermal cases.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900">100% Hygienic Packaging</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Tamper-evident food grade biodegradable containers to ensure zero spill and warmth retention.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900">Live Kitchen Tracking</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Watch your food transition live from kitchen prep to rider pickup with secure OTP verification.
            </p>
          </div>
        </div>
      </section>

      {/* 6. PRODUCT CUSTOMIZATION MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 space-y-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-100">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-900/80 text-white flex items-center justify-center hover:bg-stone-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedProduct.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                ></span>
                <span className="text-xs font-bold text-stone-500 uppercase">
                  {selectedProduct.isVeg ? 'Pure Veg' : 'Non-Vegetarian'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-stone-900">{selectedProduct.name}</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {selectedProduct.description}
              </p>
              <p className="text-xl font-black text-orange-600 mt-2">₹{selectedProduct.price}</p>
            </div>

            {/* Add-ons Selector */}
            {selectedProduct.addOns && selectedProduct.addOns.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Select Gourmet Add-ons
                </h4>
                <div className="space-y-2">
                  {selectedProduct.addOns.map((addon) => {
                    const isChecked = selectedAddOns.some((a) => a.name === addon.name);
                    return (
                      <label
                        key={addon.name}
                        onClick={() => handleToggleAddOn(addon)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-orange-50 border-orange-300 text-orange-950'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span>{addon.name}</span>
                        </div>
                        <span>+₹{addon.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Special Cooking Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Less spicy, make it extra crispy, keep dip on side..."
                rows={2}
                className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Quantity Stepper & Add Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-stone-100">
              <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-black text-stone-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 font-bold"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCartConfirm}
                className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/30 transition-all text-sm flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  Add to Order • ₹
                  {(
                    (selectedProduct.price +
                      selectedAddOns.reduce((sum, a) => sum + a.price, 0)) *
                    quantity
                  ).toFixed(2)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
