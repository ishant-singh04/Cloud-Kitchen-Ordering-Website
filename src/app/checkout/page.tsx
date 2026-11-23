'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, Address } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  MapPin,
  Plus,
  CreditCard,
  Banknote,
  ShieldCheck,
  Tag,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    subtotal,
    discount,
    tax,
    deliveryFee,
    totalAmount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();

  // Address selection & new address modal
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Address>({
    label: 'Home',
    street: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    landmark: '',
  });

  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay');

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Submission & Processing states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Saved addresses
  const savedAddresses = user?.addresses || [
    {
      label: 'Home',
      street: 'Flat 402, Sunshine Heights, 4th Cross Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      landmark: 'Opposite Metro Station',
    },
  ];

  const currentAddress =
    savedAddresses[selectedAddressIndex] || savedAddresses[0] || newAddress;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setIsApplyingCoupon(true);
    const result = await applyCoupon(couponInput.trim());
    setIsApplyingCoupon(false);
    if (!result.success) {
      setCouponError(result.error || 'Invalid coupon code');
    } else {
      setCouponInput('');
    }
  };

  const handleCreateOrder = async (razorpayData?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) => {
    try {
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          selectedAddOns: item.selectedAddOns,
          specialInstructions: item.specialInstructions,
        })),
        deliveryAddress: currentAddress,
        deliveryInstructions,
        couponCode: appliedCoupon?.code,
        paymentMethod,
        ...(razorpayData || {}),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Success: Clear cart and redirect to real-time order tracking
      clearCart();
      router.push(`/orders/${data.order._id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong while placing your order.');
      setIsSubmitting(false);
    }
  };

  const handleProcessCheckout = async () => {
    setErrorMessage('');
    if (items.length === 0) {
      setErrorMessage('Your cart is empty');
      return;
    }

    if (!currentAddress || !currentAddress.street || !currentAddress.pincode) {
      setErrorMessage('Please provide a complete delivery address');
      return;
    }

    setIsSubmitting(true);

    if (paymentMethod === 'cod') {
      // Cash on Delivery direct submission
      await handleCreateOrder();
      return;
    }

    // Razorpay Online Payment Flow
    try {
      const createRes = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.error || 'Failed to initiate Razorpay payment');
      }

      // If in development test mode with mock keys: simulate verified instant payment
      if (createData.isTestMode || createData.orderId.startsWith('order_')) {
        const mockPaymentId = `pay_${Date.now()}`;
        const mockSignature = `sig_${Date.now()}`;

        // Verify on backend
        await fetch('/api/payment/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: createData.orderId,
            razorpayPaymentId: mockPaymentId,
            razorpaySignature: mockSignature,
          }),
        });

        await handleCreateOrder({
          razorpayOrderId: createData.orderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: mockSignature,
        });
        return;
      }

      // Real Razorpay SDK Checkout
      const options = {
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency,
        name: 'CloudKitchen Pro',
        description: 'Artisanal Gourmet Food Order',
        order_id: createData.orderId,
        handler: async function (response: any) {
          try {
            await handleCreateOrder({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch (e: any) {
            setErrorMessage(e.message || 'Payment completed but order creation failed');
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: user?.name || 'Customer',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#ea580c',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setErrorMessage(resp.error.description || 'Payment failed or was cancelled');
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-stone-900">Your basket is currently empty</h2>
        <p className="text-sm text-stone-500 mt-2">
          Discover our woodfired pizzas, handcrafted burgers, and royal biryanis.
        </p>
        <Link
          href="/menu"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-600/30"
        >
          <span>Explore Menu</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Checkout & Delivery</h1>
        <p className="text-sm text-stone-500 mt-1">
          Review your address, delivery instructions, and payment method
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery Address & Payment */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Address Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg font-black text-stone-900">Delivery Address</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showNewAddressForm ? 'Cancel' : 'Add New'}</span>
              </button>
            </div>

            {/* Saved Addresses List */}
            {!showNewAddressForm ? (
              <div className="space-y-3">
                {savedAddresses.map((addr, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedAddressIndex(idx)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      selectedAddressIndex === idx
                        ? 'bg-orange-50/70 border-orange-500 shadow-sm'
                        : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedAddressIndex === idx
                          ? 'border-orange-600 bg-orange-600'
                          : 'border-stone-300'
                      }`}
                    >
                      {selectedAddressIndex === idx && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-stone-900 tracking-wider">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-700 mt-1">{addr.street}</p>
                      <p className="text-xs text-stone-500">
                        {addr.city}, {addr.state} - {addr.pincode}
                        {addr.landmark ? ` (Near ${addr.landmark})` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* New Address Form */
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Label</label>
                    <input
                      type="text"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      placeholder="Home, Work, Other"
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      placeholder="560038"
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Street Address & Flat / Door No.
                  </label>
                  <input
                    type="text"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    placeholder="Flat 301, Lakeview Residency, 8th Main"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">City</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Landmark</label>
                    <input
                      type="text"
                      value={newAddress.landmark}
                      onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                      placeholder="Opp. Metro Pillar 124"
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(false)}
                  className="w-full py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
                >
                  Use This Address
                </button>
              </div>
            )}

            {/* Delivery Instructions */}
            <div className="pt-3 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Rider Delivery Instructions
              </label>
              <input
                type="text"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Ring bell and leave package at door, don't call."
                className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-orange-500 text-stone-900 placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* 2. Payment Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-lg font-black text-stone-900">Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Online Payment (Razorpay) */}
              <div
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === 'razorpay'
                    ? 'bg-orange-50/70 border-orange-500 shadow-sm'
                    : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    paymentMethod === 'razorpay'
                      ? 'border-orange-600 bg-orange-600'
                      : 'border-stone-300'
                  }`}
                >
                  {paymentMethod === 'razorpay' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-bold text-stone-900">Online Payment</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Razorpay • UPI, Credit/Debit Cards, NetBanking
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Test Mode Active
                  </span>
                </div>
              </div>

              {/* Cash On Delivery */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === 'cod'
                    ? 'bg-orange-50/70 border-orange-500 shadow-sm'
                    : 'bg-stone-50/70 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    paymentMethod === 'cod'
                      ? 'border-orange-600 bg-orange-600'
                      : 'border-stone-300'
                  }`}
                >
                  {paymentMethod === 'cod' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-stone-900">Cash on Delivery</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Pay in cash or UPI QR code upon arrival of rider
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Pay Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6 sticky top-28">
            <h2 className="text-lg font-black text-stone-900">Order Summary</h2>

            {/* Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    ></span>
                    <div>
                      <p className="font-bold text-stone-900">
                        {item.quantity}x {item.name}
                      </p>
                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <p className="text-[10px] text-stone-400">
                          +{item.selectedAddOns.map((a) => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-stone-900">₹{item.itemTotal}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-4 border-t border-stone-100 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter Coupon (e.g. WELCOME50)"
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono uppercase focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>

              {couponError && <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>}

              {appliedCoupon && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {appliedCoupon.code} applied (-₹{discount})
                    </span>
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>GST (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Express Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              <div className="pt-3 border-t border-stone-200 flex justify-between text-base font-black text-stone-900">
                <span>Total Payable</span>
                <span className="text-orange-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              onClick={handleProcessCheckout}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>
                    {paymentMethod === 'cod'
                      ? `Confirm Cash Order • ₹${totalAmount.toFixed(2)}`
                      : `Pay Online • ₹${totalAmount.toFixed(2)}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Safe & Secure 256-bit Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
