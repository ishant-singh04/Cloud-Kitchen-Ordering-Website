'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import {
  UtensilsCrossed,
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Play,
  Check,
  X,
  Flame,
  ArrowRight,
  RefreshCw,
  LogOut,
  Bell,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface KitchenOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    isVeg: boolean;
    selectedAddOns?: { name: string; price: number }[];
    specialInstructions?: string;
  }[];
  status: string;
  totalAmount: number;
  deliveryInstructions?: string;
  estimatedPrepTimeMinutes: number;
  createdAt: string;
}

export default function KitchenDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket('kitchen');

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [audioAllowed, setAudioAllowed] = useState(false);

  // Reject Modal
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Ingredients temporarily unavailable');
  const [isActionPending, setIsActionPending] = useState(false);

  // Web Audio Context for synthesized sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = () => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  const fetchKitchenOrders = async () => {
    try {
      const res = await fetch('/api/orders?limit=100');
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Fetch kitchen orders error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
  }, []);

  // Listen to Socket.IO events for live incoming orders & status changes
  useEffect(() => {
    if (!socket) return;

    socket.on('order:new', (payload: any) => {
      console.log('[Kitchen Socket] New order arrived:', payload);
      playChime();
      fetchKitchenOrders();
    });

    socket.on('order:status_updated', (payload: any) => {
      console.log('[Kitchen Socket] Order updated:', payload);
      fetchKitchenOrders();
    });

    return () => {
      socket.off('order:new');
      socket.off('order:status_updated');
    };
  }, [socket, isMuted]);

  const handleUpdateStatus = async (orderId: string, status: string, note?: string) => {
    setIsActionPending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      const data = await res.json();
      if (data.success) {
        fetchKitchenOrders();
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating order');
    } finally {
      setIsActionPending(false);
      setRejectOrderId(null);
    }
  };

  // Group orders by column
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP');
  const completedOrders = orders
    .filter((o) => ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status))
    .slice(0, 10);

  const getElapsedMinutes = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return Math.max(0, diff);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Operations Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">Kitchen Operations Display</h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-stone-950">
                Live KDS
              </span>
            </div>
            <p className="text-xs text-stone-400">CloudKitchen Pro • Station 1 (Master Dispatch)</p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-3">
          {/* Audio Chime Mute/Unmute */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              setAudioAllowed(true);
              if (isMuted) playChime();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              isMuted
                ? 'bg-stone-800 text-stone-400 border border-stone-700'
                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? 'Alerts Muted' : 'Audio Live'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchKitchenOrders}
            className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/"
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
          >
            Storefront
          </Link>
          <Link
            href="/admin"
            className="px-3 py-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 text-xs font-semibold"
          >
            Admin HQ
          </Link>
        </div>
      </header>

      {/* Main Kanban Board Container */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 min-w-[1200px] items-start">
          {/* COLUMN 1: NEW / PENDING ORDERS */}
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 space-y-4 flex flex-col max-h-[calc(100vh-140px)]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  New Incoming
                </h2>
              </div>
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">
                {pendingOrders.length}
              </span>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {pendingOrders.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-8">No new orders waiting</p>
              ) : (
                pendingOrders.map((order) => {
                  const elapsed = getElapsedMinutes(order.createdAt);
                  const isOverdue = elapsed > 5;

                  return (
                    <div
                      key={order._id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isOverdue
                          ? 'bg-rose-950/40 border-rose-600/70 shadow-lg shadow-rose-950/30'
                          : 'bg-stone-800/90 border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-white">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isOverdue
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {elapsed}m ago
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 py-1 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="border-b border-stone-700/50 pb-1 last:border-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  item.isVeg ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              ></span>
                              <span className="font-black text-amber-200 text-sm">
                                {item.quantity}x
                              </span>
                              <span className="font-bold text-white">{item.name}</span>
                            </div>
                            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                              <p className="text-[11px] text-amber-400/90 pl-4">
                                + {item.selectedAddOns.map((a) => a.name).join(', ')}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-[11px] text-orange-400 italic pl-4">
                                &quot;{item.specialInstructions}&quot;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Touch Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'CONFIRMED')}
                          disabled={isActionPending}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => setRejectOrderId(order._id)}
                          disabled={isActionPending}
                          className="py-2.5 px-3 rounded-xl bg-stone-700 hover:bg-rose-900 text-stone-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: CONFIRMED */}
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 space-y-4 flex flex-col max-h-[calc(100vh-140px)]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <h2 className="text-sm font-black uppercase tracking-wider text-blue-400">
                  Confirmed
                </h2>
              </div>
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-black flex items-center justify-center">
                {confirmedOrders.length}
              </span>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {confirmedOrders.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-8">Queue empty</p>
              ) : (
                confirmedOrders.map((order) => (
                  <div
                    key={order._id}
                    className="p-4 rounded-2xl bg-stone-800/90 border border-blue-500/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-white">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs font-bold text-stone-400">
                        {getElapsedMinutes(order.createdAt)}m elapsed
                      </span>
                    </div>

                    <div className="space-y-1 py-1 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="font-black text-blue-300">{item.quantity}x</span>
                          <span className="font-bold text-white">{item.name}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(order._id, 'PREPARING')}
                      disabled={isActionPending}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Cooking</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: PREPARING (IN COOKING) */}
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 space-y-4 flex flex-col max-h-[calc(100vh-140px)]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
                <h2 className="text-sm font-black uppercase tracking-wider text-purple-400">
                  On Stove / Prep
                </h2>
              </div>
              <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-black flex items-center justify-center">
                {preparingOrders.length}
              </span>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {preparingOrders.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-8">No active pans</p>
              ) : (
                preparingOrders.map((order) => {
                  const elapsed = getElapsedMinutes(order.createdAt);
                  const isOverdue = elapsed > (order.estimatedPrepTimeMinutes || 20);

                  return (
                    <div
                      key={order._id}
                      className={`p-4 rounded-2xl border space-y-3 ${
                        isOverdue
                          ? 'bg-purple-950/40 border-rose-500'
                          : 'bg-stone-800/90 border-purple-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-white">
                          #{order.orderNumber}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-purple-300">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span>{elapsed}m / {order.estimatedPrepTimeMinutes || 20}m</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 py-1 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx}>
                            <p className="font-bold text-white">
                              <span className="text-purple-400 font-black">{item.quantity}x</span>{' '}
                              {item.name}
                            </p>
                            {item.specialInstructions && (
                              <p className="text-[11px] text-amber-300 italic pl-3">
                                &quot;{item.specialInstructions}&quot;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleUpdateStatus(order._id, 'READY_FOR_PICKUP')}
                        disabled={isActionPending}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Food Ready & Packed</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 4: READY FOR PICKUP */}
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 space-y-4 flex flex-col max-h-[calc(100vh-140px)]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400">
                  Ready For Pickup
                </h2>
              </div>
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">
                {readyOrders.length}
              </span>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {readyOrders.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-8">Pickup counter clear</p>
              ) : (
                readyOrders.map((order) => (
                  <div
                    key={order._id}
                    className="p-4 rounded-2xl bg-stone-800/90 border border-emerald-500/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-white">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                        On Counter
                      </span>
                    </div>

                    <p className="text-xs text-stone-300">
                      {order.items.length} items packed in insulated bag
                    </p>

                    <div className="p-2 rounded-xl bg-stone-900 text-xs text-stone-400 flex items-center justify-between">
                      <span>Customer: {order.customerName}</span>
                      <span className="font-bold text-white">₹{order.totalAmount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 5: DISPATCHED / COMPLETED */}
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 space-y-4 flex flex-col max-h-[calc(100vh-140px)] opacity-75">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="text-sm font-black uppercase tracking-wider text-stone-400">
                Dispatched
              </h2>
              <span className="text-xs font-semibold text-stone-500">Recent 10</span>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1 text-xs">
              {completedOrders.length === 0 ? (
                <p className="text-stone-500 text-center py-8">No recent dispatches</p>
              ) : (
                completedOrders.map((order) => (
                  <div
                    key={order._id}
                    className="p-3 rounded-xl bg-stone-800/50 border border-stone-700/40 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-mono font-bold text-stone-200">#{order.orderNumber}</p>
                      <p className="text-[11px] text-stone-500">{order.customerName}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-orange-950 text-orange-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Reject Order Reason Modal */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-5">
            <h3 className="text-lg font-black text-white">Reject Incoming Order</h3>
            <p className="text-xs text-stone-400">
              Please specify a reason for rejection. The customer will be notified immediately.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300">Reason</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-stone-800 border border-stone-700 text-xs text-white"
              >
                <option value="Ingredients temporarily unavailable">Ingredients unavailable</option>
                <option value="Kitchen at maximum capacity">Kitchen at maximum capacity</option>
                <option value="Closing for maintenance">Closing for maintenance</option>
                <option value="Special customization cannot be fulfilled">Customization impossible</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRejectOrderId(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(rejectOrderId, 'REJECTED', rejectReason)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
