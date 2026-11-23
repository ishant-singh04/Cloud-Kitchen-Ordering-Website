'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDedicatedPortal =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/kitchen') ||
    pathname.startsWith('/delivery');

  if (isDedicatedPortal) {
    return <main className="min-h-screen bg-stone-950 text-stone-100">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-orange-500 selection:text-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <CartDrawer />
      <Footer />
    </div>
  );
}
