'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Star,
  Clock,
  Plus,
  ShoppingBag,
  Filter,
  Check,
  UtensilsCrossed,
} from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string | { _id: string; name: string; slug: string };
  image: string;
  isVeg: boolean;
  isBestseller: boolean;
  isAvailable: boolean;
  inStock: boolean;
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
}

function MenuContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const { addToCart, setIsCartOpen } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating'>('popular');

  // Customization Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: number }[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ])
      .then(([catRes, prodRes]) => {
        if (catRes.success && catRes.categories) setCategories(catRes.categories);
        if (prodRes.success && prodRes.products) setProducts(prodRes.products);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Sync category param if URL changes
  useEffect(() => {
    const c = searchParams.get('category');
    if (c) setSelectedCategorySlug(c);
  }, [searchParams]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        if (selectedCategorySlug !== 'all') {
          const categoryObj = categories.find((c) => c.slug === selectedCategorySlug);
          const pCatId = typeof product.categoryId === 'string' ? product.categoryId : product.categoryId?._id;
          if (categoryObj && pCatId !== categoryObj._id) {
            return false;
          }
        }

        // Veg / Non-Veg filter
        if (vegFilter === 'veg' && !product.isVeg) return false;
        if (vegFilter === 'nonveg' && product.isVeg) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchDesc = product.description.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });
  }, [products, categories, selectedCategorySlug, vegFilter, searchQuery, sortBy]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 to-stone-800 p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider border border-orange-500/30">
            Freshly Made To Order
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-2 text-white">
            Our Artisanal Kitchen Menu
          </h1>
          <p className="text-sm text-stone-300 mt-1 max-w-xl">
            Woodfired pizzas, artisanal smash burgers, slow-cooked royal dum biryanis, wok specialties, and desserts.
          </p>
        </div>

        {/* Live Express Delivery Status */}
        <div className="bg-stone-800/90 border border-stone-700/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Express Dispatch Active</p>
            <p className="text-[11px] text-stone-400">Avg. preparation & delivery: 30-35 mins</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Search & Sort Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, toppings, spices..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900 placeholder:text-stone-400 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Veg / Non-Veg Toggle Filter */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/80 text-xs font-bold">
              <button
                onClick={() => setVegFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  vegFilter === 'all' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVegFilter('veg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  vegFilter === 'veg'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-emerald-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Pure Veg</span>
              </button>
              <button
                onClick={() => setVegFilter('nonveg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  vegFilter === 'nonveg'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-rose-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Non-Veg</span>
              </button>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="py-2 px-3 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategorySlug('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategorySlug === 'all'
                ? 'bg-stone-900 text-white shadow-md'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategorySlug(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategorySlug === cat.slug
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dishes Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-stone-500 mt-4">Loading artisanal menu...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8">
          <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900">No dishes found matching your criteria</h3>
          <p className="text-xs text-stone-500 mt-1">Try resetting filters or search terms.</p>
          <button
            onClick={() => {
              setSelectedCategorySlug('all');
              setVegFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs border border-orange-200"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="group rounded-3xl bg-white border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Veg / Non-Veg Badge */}
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

                {/* Bestseller Badge */}
                {product.isBestseller && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded text-[10px] flex items-center gap-1 shadow-sm uppercase tracking-wider">
                    <Flame className="w-3 h-3 fill-stone-950" />
                    Bestseller
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex items-center gap-3 mt-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {product.prepTimeMinutes} mins
                    </span>
                    {product.calories && <span>• {product.calories} kcal</span>}
                    {product.addOns && product.addOns.length > 0 && (
                      <span className="text-orange-600 font-semibold">• Customizable</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-stone-900">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs line-through text-stone-400">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {product.inStock && product.isAvailable ? (
                    <button
                      onClick={() => handleOpenCustomize(product)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/30 transition-all hover:scale-105"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{product.addOns && product.addOns.length > 0 ? 'Customize' : 'Add +'}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-xl">
                      Sold Out
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customization Modal */}
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

export default function MenuPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-stone-500 mt-4">Loading artisanal menu...</p>
        </div>
      }
    >
      <MenuContent />
    </React.Suspense>
  );
}
