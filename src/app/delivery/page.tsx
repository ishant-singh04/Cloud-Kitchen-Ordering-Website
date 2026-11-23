'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import {
  Bike,
  Phone,
  MapPin,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  CreditCard,
  Navigation,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

interface DeliveryAssignmentData {
  _id: string;
  orderId: {
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
      quantity: number;
    }[];
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    deliveryOtp: string;
  };
  status: string;
  assignedAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  deliveryOtp: string;
  otpVerified: boolean;
  notes?: string;
}

export default function DeliveryDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket(user ? `user:${user.id}` : undefined);

  const [assignments, setAssignments] = useState<DeliveryAssignmentData[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // OTP Verification Modal
  const [otpModalAssignment, setOtpModalAssignment] = useState<DeliveryAssignmentData | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

  // Failed Delivery Modal
  const [failedModalAssignment, setFailedModalAssignment] = useState<DeliveryAssignmentData | null>(null);
  const [failureReason, setFailureReason] = useState('Customer unreachable at phone/door');
  const [isSubmittingFailure, setIsSubmittingFailure] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/delivery/assignments');
      const data = await res.json();
      if (data.success && data.assignments) {
        setAssignments(data.assignments);
      }
    } catch (err) {
      console.error('Fetch assignments error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Real-time Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('delivery:assigned', (payload: any) => {
      console.log('[Delivery Socket] New assignment received:', payload);
      fetchAssignments();
    });

    socket.on('delivery:status_updated', (payload: any) => {
      console.log('[Delivery Socket] Assignment status updated:', payload);
      fetchAssignments();
    });

    return () => {
      socket.off('delivery:assigned');
      socket.off('delivery:status_updated');
    };
  }, [socket]);

  // Toggle shift availability
  const handleToggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      await fetch('/api/delivery/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextState }),
      });
    } catch (e) {
      console.error('Failed to update availability:', e);
    }
  };

  // Status transitions
  const handleUpdateStatus = async (assignmentId: string, status: string, additionalData?: any) => {
    try {
      const res = await fetch(`/api/delivery/assignments/${assignmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...additionalData }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAssignments();
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to update status' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error updating status' };
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalAssignment) return;
    setOtpError('');
    setIsSubmittingOtp(true);

    const res = await handleUpdateStatus(otpModalAssignment._id, 'DELIVERED', {
      otp: enteredOtp.trim(),
    });

    setIsSubmittingOtp(false);
    if (res.success) {
      setOtpModalAssignment(null);
      setEnteredOtp('');
    } else {
      setOtpError(res.error || 'Invalid OTP');
    }
  };

  const handleReportFailureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failedModalAssignment) return;
    setIsSubmittingFailure(true);

    const res = await handleUpdateStatus(failedModalAssignment._id, 'DELIVERY_FAILED', {
      failureReason,
    });

    setIsSubmittingFailure(false);
    if (res.success) {
      setFailedModalAssignment(null);
    } else {
      alert(res.error || 'Failed to report issue');
    }
  };

  // Location update simulation for active delivery
  const handleSendLocationPing = async (assignmentId: string) => {
    try {
      // Simulate slight move near Bangalore Indiranagar
      const randomOffsetLat = (Math.random() - 0.5) * 0.005;
      const randomOffsetLng = (Math.random() - 0.5) * 0.005;
      const lat = 12.9716 + randomOffsetLat;
      const lng = 77.5946 + randomOffsetLng;

      await fetch(`/api/delivery/assignments/${assignmentId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      alert('Location update ping broadcast to customer tracking screen!');
    } catch (e) {
      console.error('Location update error:', e);
    }
  };

  const activeAssignments = assignments.filter((a) =>
    ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(a.status)
  );
  const completedAssignments = assignments.filter((a) => a.status === 'DELIVERED');

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-16">
      {/* Mobile-first Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white">Delivery Fleet Console</h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-400 text-stone-950">
                In-House
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {user ? user.name : 'Santosh Kumar (Rider #1)'} • {user?.vehicleType || 'Express Bike'}
            </p>
          </div>
        </div>

        {/* Duty Toggle & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggleAvailability}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isAvailable
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-stone-800 text-stone-500 border border-stone-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
              }`}
            ></span>
            <span>{isAvailable ? 'On Duty' : 'Off Duty'}</span>
          </button>

          <Link
            href="/"
            className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white"
            title="Storefront"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Content Tabs */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-stone-900 p-1 rounded-2xl border border-stone-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>Active Deliveries</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {activeAssignments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <span>Completed</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {completedAssignments.length}
            </span>
          </button>
        </div>

        {/* Active Deliveries View */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-16 text-center text-stone-500 text-xs">Loading assignments...</div>
            ) : activeAssignments.length === 0 ? (
              <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 text-center space-y-3">
                <Bike className="w-12 h-12 text-stone-700 mx-auto" />
                <h3 className="font-bold text-white text-base">No Active Deliveries Assigned</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  Orders ready for pickup in the kitchen will be assigned by the dispatcher and pop up here instantly.
                </p>
              </div>
            ) : (
              activeAssignments.map((assignment) => {
                const order = assignment.orderId;
                if (!order) return null;

                const isCod = order.paymentMethod === 'cod';

                return (
                  <div
                    key={assignment._id}
                    className="p-5 sm:p-6 rounded-3xl bg-stone-900 border border-emerald-500/40 shadow-xl space-y-5"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-lg text-white">
                            #{order.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {assignment.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Assigned: {new Date(assignment.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* COD Collect Tag */}
                      <div className="text-right">
                        <span className="text-xl font-black text-white">₹{order.totalAmount}</span>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          {isCod ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] border border-amber-500/30">
                              Collect Cash: ₹{order.totalAmount}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              Prepaid Online
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="space-y-3 text-xs">
                      {/* Customer Name & Phone Click-to-call */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-800/80">
                        <div>
                          <p className="font-bold text-white text-sm">{order.customerName}</p>
                          <p className="text-stone-400">{order.customerPhone}</p>
                        </div>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      </div>

                      {/* Destination Address */}
                      <div className="p-3.5 rounded-2xl bg-stone-800/80 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-white">
                                {order.deliveryAddress?.label || 'Destination'}
                              </p>
                              <p className="text-stone-300">{order.deliveryAddress?.street}</p>
                              <p className="text-stone-400">
                                {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                                {order.deliveryAddress?.landmark ? ` (Near ${order.deliveryAddress.landmark})` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Open in Google Maps */}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200"
                            title="Open in Maps"
                          >
                            <Navigation className="w-4 h-4" />
                          </a>
                        </div>

                        {order.deliveryInstructions && (
                          <p className="text-[11px] text-amber-300 font-medium pt-1.5 border-t border-stone-700/80">
                            Instructions: &quot;{order.deliveryInstructions}&quot;
                          </p>
                        )}
                      </div>

                      {/* Food Items Summary */}
                      <div className="p-3 rounded-2xl bg-stone-800/40 text-stone-300 text-xs">
                        <p className="font-bold text-stone-400 uppercase text-[10px] mb-1">
                          Food Items ({order.items.length})
                        </p>
                        <p>{order.items.map((i) => `${i.quantity}x ${i.name}`).join(' • ')}</p>
                      </div>
                    </div>

                    {/* Step-by-Step Rider Action Controls */}
                    <div className="pt-2 space-y-2">
                      {assignment.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleUpdateStatus(assignment._id, 'ACCEPTED')}
                          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept Assignment</span>
                        </button>
                      )}

                      {assignment.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus(assignment._id, 'PICKED_UP')}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30"
                        >
                          <Bike className="w-4 h-4" />
                          <span>Confirm Pickup from Kitchen</span>
                        </button>
                      )}

                      {(assignment.status === 'PICKED_UP' ||
                        assignment.status === 'OUT_FOR_DELIVERY') && (
                        <div className="space-y-2">
                          {/* Complete with OTP button */}
                          <button
                            onClick={() => {
                              setOtpModalAssignment(assignment);
                              setEnteredOtp('');
                              setOtpError('');
                            }}
                            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/40"
                          >
                            <KeyRound className="w-5 h-5" />
                            <span>Verify OTP & Mark Delivered</span>
                          </button>

                          {/* Quick Location Broadcast Ping */}
                          <button
                            type="button"
                            onClick={() => handleSendLocationPing(assignment._id)}
                            className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <Navigation className="w-3.5 h-3.5 text-orange-400" />
                            <span>Broadcast Live GPS Update to Customer</span>
                          </button>
                        </div>
                      )}

                      {/* Exception / Issue Button */}
                      <button
                        onClick={() => setFailedModalAssignment(assignment)}
                        className="w-full py-2 text-stone-400 hover:text-rose-400 text-xs font-semibold text-center"
                      >
                        Report Delivery Problem / Unreachable
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Completed Deliveries History View */}
        {activeTab === 'completed' && (
          <div className="space-y-3">
            {completedAssignments.length === 0 ? (
              <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 text-center text-stone-500 text-xs">
                No deliveries marked completed yet.
              </div>
            ) : (
              completedAssignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-mono font-bold text-white">
                      #{assignment.orderId?.orderNumber || 'Order'}
                    </p>
                    <p className="text-stone-400">{assignment.orderId?.customerName}</p>
                    <p className="text-[10px] text-stone-500">
                      Delivered: {assignment.deliveredAt ? new Date(assignment.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Completed'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">✓ OTP Verified</span>
                    <p className="text-stone-400">₹{assignment.orderId?.totalAmount}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* OTP Verification Modal (Mandatory Security Check) */}
      {otpModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Verify Delivery OTP</h3>
              <p className="text-xs text-stone-400 mt-1">
                Ask the customer for the 4-digit code shown on their order tracking screen:
              </p>
            </div>

            {otpError && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                maxLength={4}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-full py-3 text-center font-mono font-black text-3xl tracking-widest rounded-2xl bg-stone-950 border-2 border-emerald-500/70 text-white focus:outline-none focus:border-emerald-400"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpModalAssignment(null)}
                  className="flex-1 py-3 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enteredOtp.length !== 4 || isSubmittingOtp}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs disabled:opacity-40"
                >
                  {isSubmittingOtp ? 'Verifying...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Failed Delivery Modal */}
      {failedModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-black text-white">Report Delivery Issue</h3>
            <p className="text-xs text-stone-400">
              Please specify the reason why delivery could not be completed:
            </p>

            <form onSubmit={handleReportFailureSubmit} className="space-y-4">
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-stone-800 border border-stone-700 text-xs text-white"
              >
                <option value="Customer unreachable at phone/door">Customer unreachable</option>
                <option value="Incorrect or incomplete address">Incorrect / inaccessible address</option>
                <option value="Customer refused delivery">Customer refused delivery</option>
                <option value="Vehicle breakdown / emergency">Vehicle breakdown</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFailedModalAssignment(null)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFailure}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
                >
                  Submit Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
