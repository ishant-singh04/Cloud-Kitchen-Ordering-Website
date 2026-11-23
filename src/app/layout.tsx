import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'CloudKitchen Pro | Single-Restaurant Gourmet Ordering & Operations',
  description:
    'Experience chef-crafted artisanal dining with live order tracking, express in-house delivery, and automated kitchen operations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <AuthProvider>
          <CartProvider>
            <AppShell>{children}</AppShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
