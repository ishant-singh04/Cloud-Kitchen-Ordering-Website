'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  UtensilsCrossed,
  ShoppingBag,
  User as UserIcon,
  Menu as MenuIcon,
  X,
  ChefHat,
  LayoutDashboard,
  LogOut,
  Clock,
  Sparkles,
  Bike,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, switchQuickDemo } = useAuth();
  const { totalItemCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Hide customer navbar on dedicated admin/kitchen dashboards
  const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/kitchen');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-7 h-7" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-stone-900 group-hover:text-orange-600 transition-colors">
                CloudKitchen<span className="text-orange-600 font-extrabold">PRO</span>
              </span>
              <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Kitchen Open • 30m Express Delivery</span>
              </div>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm font-semibold transition-colors ${
                pathname === '/' ? 'text-orange-600 font-bold' : 'text-stone-700 hover:text-orange-600'
              }`}
            >
              Home
            </Link>
            <Link
              href="/menu"
              className={`text-sm font-semibold transition-colors ${
                pathname.startsWith('/menu') ? 'text-orange-600 font-bold' : 'text-stone-700 hover:text-orange-600'
              }`}
            >
              Menu & Order
            </Link>
            <Link
              href="/#offers"
              className="text-sm font-semibold text-stone-700 hover:text-orange-600 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Special Offers
            </Link>
            {user?.role === 'customer' && (
              <Link
                href="/profile"
                className={`text-sm font-semibold transition-colors ${
                  pathname === '/profile' ? 'text-orange-600 font-bold' : 'text-stone-700 hover:text-orange-600'
                }`}
              >
                My Orders
              </Link>
            )}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Portal Switchers (Admin / Kitchen / Delivery) */}
            <div className="hidden lg:flex items-center gap-2 pr-3 border-r border-stone-200">
              <Link
                href="/kitchen"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 text-amber-400 hover:bg-stone-800 transition-colors shadow-sm"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Kitchen Ops
              </Link>
              <Link
                href="/delivery"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <Bike className="w-3.5 h-3.5" />
                Delivery Portal
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl bg-stone-100 hover:bg-orange-50 text-stone-800 hover:text-orange-600 transition-colors group"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-6 h-6 group-hover:scale-105 transition-transform" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* User Account / Profile Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-semibold transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                    {user.role}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-sm font-bold text-stone-900">{user.name}</p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    </div>

                    {user.role === 'customer' && (
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition-colors"
                      >
                        <UserIcon className="w-4 h-4" />
                        My Profile & Orders
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    {user.role === 'kitchen' && (
                      <Link
                        href="/kitchen"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition-colors"
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        Kitchen Orders Board
                      </Link>
                    )}

                    {user.role === 'delivery' && (
                      <Link
                        href="/delivery"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition-colors"
                      >
                        <Bike className="w-4 h-4" />
                        Delivery Portal
                      </Link>
                    )}

                    <div className="border-t border-stone-100 my-1"></div>

                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-600/30 transition-all hover:scale-[1.02]"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-stone-900 hover:bg-orange-50 hover:text-orange-600"
          >
            Home
          </Link>
          <Link
            href="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-stone-900 hover:bg-orange-50 hover:text-orange-600"
          >
            Menu & Order
          </Link>
          <Link
            href="/kitchen"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-amber-800 bg-amber-50"
          >
            👨‍🍳 Kitchen Ops Board
          </Link>
          <Link
            href="/delivery"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-emerald-800 bg-emerald-50"
          >
            🛵 Delivery Portal
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-orange-800 bg-orange-50"
          >
            👑 Admin Dashboard
          </Link>
          {!user && (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-xl border border-stone-300"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-sm font-bold rounded-xl bg-orange-600 text-white"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
