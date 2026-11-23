'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  User as UserIcon,
  ShoppingBag,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  RotateCw,
} from 'lucide-react';

interface OrderHistoryItem {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
  };
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    itemTotal: number;
  }[];
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.orders) {
            setOrders(data.orders);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingOrders(false));
    }
  }, [user, authLoading, router]);

  const handleReorder = (order: OrderHistoryItem) => {
    for (const item of order.items) {
      addToCart(
        {
          _id: item.productId,
          name: item.name,
          price: item.price,
          isVeg: true,
          image: '',
        },
        item.quantity
      );
    }
    setIsCartOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'READY_FOR_PICKUP':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'OUT_FOR_DELIVERY':
        return 'bg-orange-100 text-orange-800 border-orange-200 animate-pulse';
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
      case 'REJECTED':
      case 'DELIVERY_FAILED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  if (authLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-orange-600/30">
          {user?.name.charAt(0)}
        </div>
        <div className="text-center sm:text-left flex-1 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900">{user?.name}</h1>
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 w-fit mx-auto sm:mx-0">
              {user?.role}
            </span>
          </div>
          <p className="text-sm text-stone-500">{user?.email}</p>
          <p className="text-xs text-stone-400">{user?.phone}</p>
        </div>
      </div>

      {/* Orders History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">Your Order History</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Track live deliveries and view past gourmet meals
            </p>
          </div>
          <Link
            href="/menu"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>Order New Meal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoadingOrders ? (
          <div className="py-12 text-center text-stone-400 text-sm">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-bold text-stone-900">No past orders found</h3>
            <p className="text-xs text-stone-500">
              When you place an order, it will appear here for live tracking and receipts.
            </p>
            <Link
              href="/menu"
              className="inline-block px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-stone-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>• {order.deliveryAddress?.street || 'Delivery Address'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                  <div className="text-right">
                    <p className="text-base font-black text-stone-900">
                      ₹{order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-stone-400">
                      {order.paymentMethod}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorder(order)}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                      title="Reorder items"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/orders/${order._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm shadow-orange-600/30 transition-all"
                    >
                      <span>Track Order</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
