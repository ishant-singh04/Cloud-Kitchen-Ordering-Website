'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartAddOn {
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // Unique cart item ID (product ID + serialized addons)
  productId: string;
  name: string;
  price: number;
  image: string;
  isVeg: boolean;
  quantity: number;
  selectedAddOns: CartAddOn[];
  specialInstructions?: string;
  itemTotal: number;
}

export interface AppliedCoupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity: number, selectedAddOns?: CartAddOn[], specialInstructions?: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  totalAmount: number;
  totalItemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cloudkitchen_cart_v1';
const COUPON_STORAGE_KEY = 'cloudkitchen_coupon_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(CART_STORAGE_KEY);
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
      const savedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch (e) {
      console.error('Failed to parse cart from storage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to storage:', e);
    }
  }, [items, isLoaded]);

  // Save coupon to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save coupon to storage:', e);
    }
  }, [appliedCoupon, isLoaded]);

  // Subtotal calculation
  const subtotal = items.reduce((acc, item) => acc + item.itemTotal, 0);

  // Recalculate discount based on current subtotal if coupon is applied
  let discount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discount = appliedCoupon.discountValue;
    }
    discount = Math.min(discount, subtotal);
    discount = Math.round(discount * 100) / 100;
  }

  // Tax calculation (5% GST)
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(((taxableAmount * 5) / 100) * 100) / 100;

  // Delivery fee (₹40, free if subtotal >= ₹499 or if cart is empty)
  const deliveryFee = items.length === 0 || subtotal >= 499 ? 0 : 40;

  // Total payable amount
  const totalAmount = items.length === 0 ? 0 : Math.round((taxableAmount + tax + deliveryFee) * 100) / 100;

  const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const addToCart = (
    product: any,
    quantity: number,
    selectedAddOns: CartAddOn[] = [],
    specialInstructions: string = ''
  ) => {
    // Unique ID generation based on product and selected addons
    const sortedAddons = [...selectedAddOns].sort((a, b) => a.name.localeCompare(b.name));
    const addonKey = sortedAddons.map((a) => a.name).join('|');
    const cartItemId = `${product._id}_${addonKey}`;

    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = product.price + addOnsTotal;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          itemTotal: unitPrice * newQty,
          specialInstructions: specialInstructions || updated[existingIndex].specialInstructions,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          isVeg: product.isVeg,
          quantity,
          selectedAddOns,
          specialInstructions,
          itemTotal: unitPrice * quantity,
        };
        return [...prev, newItem];
      }
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const addOnsTotal = item.selectedAddOns.reduce((s, a) => s + a.price, 0);
          const unitPrice = item.price + addOnsTotal;
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        setAppliedCoupon(data.coupon);
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid coupon' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to apply coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        discount,
        tax,
        deliveryFee,
        totalAmount,
        totalItemCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
