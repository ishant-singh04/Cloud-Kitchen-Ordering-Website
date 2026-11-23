'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Bike,
  Home,
  ShieldCheck,
  Phone,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  MapPin,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface OrderTrackingData {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    label: string;
    street: string;
    city: string;
    pincode: string;
    landmark?: string;
  };
  deliveryInstructions?: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    selectedAddOns?: { name: string; price: number }[];
    itemTotal: number;
    isVeg: boolean;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  deliveryOtp?: string;
  deliveryStaffId?: string;
  deliveryStaffName?: string;
  deliveryStaffPhone?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  statusHistory: {
    status: string;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }[];
  estimatedPrepTimeMinutes: number;
  createdAt: string;
}

const LIFECYCLE_STEPS = [
  { key: 'PENDING', label: 'Order Received', desc: 'Sent to restaurant kitchen', icon: Clock },
  { key: 'CONFIRMED', label: 'Order Accepted', desc: 'Head chef verified ingredients', icon: ChefHat },
  { key: 'PREPARING', label: 'Cooking & Crafting', desc: 'Fresh in the kitchen', icon: ChefHat },
  { key: 'READY_FOR_PICKUP', label: 'Food Packed', desc: 'Insulated & waiting for pickup', icon: ShoppingBag },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider is on the way', icon: Bike },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your meal!', icon: CheckCircle2 },
];

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Connect to Socket room for this order
  const { socket, isConnected } = useSocket(`order:${params.id}`);

  // Fetch initial order
  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Order not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  // Listen for real-time Socket.IO events
  useEffect(() => {
    if (!socket) return;

    socket.on('order:status_updated', (payload: any) => {
      console.log('Real-time order update received:', payload);
      if (payload.order) {
        setOrder(payload.order);
      } else {
        fetchOrder();
      }
    });

    socket.on('delivery:assigned', (payload: any) => {
      console.log('Real-time delivery assignment received:', payload);
      if (payload.order) {
        setOrder(payload.order);
      } else {
        fetchOrder();
      }
    });

    socket.on('delivery:status_updated', (payload: any) => {
      console.log('Real-time delivery status received:', payload);
      if (payload.order) {
        setOrder(payload.order);
      } else {
        fetchOrder();
      }
    });

    socket.on('delivery:location_update', (payload: any) => {
      console.log('Real-time rider location update:', payload);
      if (payload.location) {
        setLiveLocation(payload.location);
      }
    });

    return () => {
      socket.off('order:status_updated');
      socket.off('delivery:assigned');
      socket.off('delivery:status_updated');
      socket.off('delivery:location_update');
    };
  }, [socket]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-stone-500 mt-4">Connecting to live kitchen feed...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900">{error || 'Order Not Found'}</h2>
        <Link
          href="/menu"
          className="inline-block px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  // Calculate current stage index in lifecycle
  const currentStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === order.status);
  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = ['CANCELLED', 'REJECTED', 'DELIVERY_FAILED'].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </Link>

        {/* Live Socket Connection Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-700">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          ></span>
          <span>{isConnected ? 'Live Socket Connected' : 'Connecting to Kitchen...'}</span>
        </div>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Order Tracking
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-xs font-medium text-stone-500">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
              Order #{order.orderNumber}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                isDelivered
                  ? 'bg-emerald-100 text-emerald-800'
                  : isCancelled
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-orange-100 text-orange-800 animate-pulse'
              }`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* SECURE DELIVERY OTP CARD (Core Feature) */}
        {!isDelivered && !isCancelled && order.deliveryOtp && (
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-5 text-white shadow-lg shadow-orange-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase font-black tracking-widest text-orange-100">
                  Secure Delivery Verification OTP
                </p>
                <p className="text-xs text-white/90 mt-0.5">
                  Share this 4-digit code with your rider upon arrival to confirm food handover:
                </p>
              </div>
            </div>

            <div className="bg-white text-stone-950 font-mono font-black text-3xl px-6 py-2.5 rounded-xl shadow-inner tracking-widest border-2 border-orange-200">
              {order.deliveryOtp}
            </div>
          </div>
        )}

        {/* Multi-step Lifecycle Visualizer */}
        {!isCancelled && (
          <div className="pt-2">
            <div className="relative">
              {/* Progress Line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-stone-100 -translate-y-1/2 z-0">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-700"
                  style={{
                    width: `${Math.max(0, (currentStepIndex / (LIFECYCLE_STEPS.length - 1)) * 100)}%`,
                  }}
                ></div>
              </div>

              {/* Step Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 relative z-10">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isDone = currentStepIndex > idx || isDelivered;
                  const isCurrent = currentStepIndex === idx && !isDelivered;

                  return (
                    <div
                      key={step.key}
                      className="flex flex-col items-center text-center space-y-2 p-2 rounded-2xl transition-all"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                            : isCurrent
                            ? 'bg-orange-600 text-white shadow-orange-600/30 scale-110 ring-4 ring-orange-100'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p
                          className={`text-xs font-bold leading-tight ${
                            isCurrent
                              ? 'text-orange-600 font-black'
                              : isDone
                              ? 'text-stone-900'
                              : 'text-stone-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[10px] text-stone-400 hidden sm:block mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* In-House Delivery Staff Information Card */}
      {order.deliveryStaffName && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  In-House Delivery Partner
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-0.5">
                  {order.deliveryStaffName}
                </h3>
              </div>
            </div>

            {order.deliveryStaffPhone && (
              <a
                href={`tel:${order.deliveryStaffPhone}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-sm transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Rider</span>
              </a>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs text-stone-600">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Insulated Thermal Carrier Equipped</span>
            </span>
            <span className="font-bold text-orange-600">
              {order.status === 'OUT_FOR_DELIVERY' ? 'En Route to Your Door' : 'Assigned & Ready'}
            </span>
          </div>
        </div>
      )}

      {/* Live Route & Delivery Address Map Preview */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600" />
            <span>Delivery Destination</span>
          </h3>
          <span className="text-xs font-semibold text-stone-500">
            Estimated Arrival: ~{order.estimatedPrepTimeMinutes || 30} mins
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1">
          <p className="font-bold text-stone-900">{order.deliveryAddress?.label || 'Destination'}</p>
          <p>{order.deliveryAddress?.street}</p>
          <p>
            {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
            {order.deliveryAddress?.landmark ? ` (Near ${order.deliveryAddress.landmark})` : ''}
          </p>
          {order.deliveryInstructions && (
            <p className="text-orange-700 font-semibold pt-1 border-t border-stone-200 mt-2">
              Note: {order.deliveryInstructions}
            </p>
          )}
        </div>
      </div>

      {/* Order Summary & Status Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Ordered Items Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-black text-stone-900">Items Ordered</h3>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1">
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
                <span className="font-bold text-stone-900">₹{item.itemTotal}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount</span>
                <span>-₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST Tax (5%)</span>
              <span>₹{order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-stone-900">
              <span>Total Amount</span>
              <span className="text-orange-600">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Real-time Order Audit Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-black text-stone-900">Status History Timeline</h3>

          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
            {order.statusHistory.map((h, i) => (
              <div key={i} className="flex items-start gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold shadow-sm z-10">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-stone-900">
                      {h.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(h.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {h.note && <p className="text-xs text-stone-500 mt-0.5">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
