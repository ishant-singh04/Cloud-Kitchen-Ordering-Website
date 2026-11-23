import React from 'react';
import Link from 'next/link';
import { ChefHat, Phone, Mail, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md">
                <ChefHat className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                CloudKitchen<span className="text-orange-500">PRO</span>
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Curating culinary excellence straight from our high-tech cloud kitchens to your doorstep. Handcrafted, fresh, and uncompromisingly delicious.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 rounded-xl px-3 py-2 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>100% FSSAI Certified & Contactless Prep</span>
            </div>
          </div>

          {/* Opening Hours & Delivery */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Kitchen Timings
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li className="flex justify-between pb-1 border-b border-stone-800">
                <span>Monday - Friday</span>
                <span className="text-white font-medium">10:00 AM - 11:45 PM</span>
              </li>
              <li className="flex justify-between pb-1 border-b border-stone-800">
                <span>Saturday - Sunday</span>
                <span className="text-white font-medium">09:30 AM - 12:30 AM</span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Late Night Cravings</span>
                <span className="text-amber-400 font-semibold">Active</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/menu" className="hover:text-orange-400 transition-colors">
                  Explore Full Menu
                </Link>
              </li>
              <li>
                <Link href="/menu?category=woodfired-pizzas" className="hover:text-orange-400 transition-colors">
                  Woodfired Artisanal Pizzas
                </Link>
              </li>
              <li>
                <Link href="/menu?category=royal-biryanis" className="hover:text-orange-400 transition-colors">
                  Royal Dum Biryanis
                </Link>
              </li>
              <li>
                <Link href="/kitchen" className="hover:text-orange-400 transition-colors">
                  Kitchen Operations Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-orange-400 transition-colors">
                  Admin Analytics & Menu Builder
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Customer Support
            </h4>
            <ul className="space-y-3 text-sm text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>Indiranagar 100ft Road, Stage 2, Bengaluru, Karnataka 560038</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                <span>orders@cloudkitchenpro.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} CloudKitchen Pro. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Gastronomy & High Performance.
          </p>
        </div>
      </div>
    </footer>
  );
}
