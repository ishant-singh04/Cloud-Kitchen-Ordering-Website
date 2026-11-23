'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ChefHat,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UtensilsCrossed,
  Bike,
  User as UserIcon,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchQuickDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Fetch current user or infer role from email
        if (email.includes('admin')) {
          router.push('/admin');
        } else if (email.includes('kitchen')) {
          router.push('/kitchen');
        } else if (email.includes('delivery') || email.includes('rider')) {
          router.push('/delivery');
        } else {
          router.push('/menu');
        }
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-stone-200/80">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 mb-4">
            <ChefHat className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">
            Welcome to <span className="text-orange-600">CloudKitchen Pro</span>
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Sign in to access your orders, kitchen operations, or dispatch console
          </p>
        </div>

        {/* Quick 1-Click Role Switcher */}
        <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Demo Logins (All 4 Roles)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => switchQuickDemo('admin')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-950 font-semibold border border-orange-200/80 transition-colors text-left"
            >
              <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
              <div>
                <p className="font-bold">👑 Admin / Owner</p>
                <p className="text-[10px] text-orange-700">Full Business HQ</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => switchQuickDemo('kitchen')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-semibold border border-amber-200/80 transition-colors text-left"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">👨‍🍳 Kitchen Chef</p>
                <p className="text-[10px] text-amber-700">Live Prep Kanban</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => switchQuickDemo('delivery')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-semibold border border-emerald-200/80 transition-colors text-left"
            >
              <Bike className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">🛵 Delivery Rider</p>
                <p className="text-[10px] text-emerald-700">Dispatch & OTP</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => switchQuickDemo('customer')}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-semibold border border-blue-200/80 transition-colors text-left"
            >
              <UserIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="font-bold">👤 Customer</p>
                <p className="text-[10px] text-blue-700">Menu & Tracking</p>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Credentials Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-stone-900 placeholder:text-stone-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-stone-900 placeholder:text-stone-400 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-600/30 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-stone-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-orange-600 hover:text-orange-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
