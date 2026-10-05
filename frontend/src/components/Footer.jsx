import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Lock, Phone, Send, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400 py-14 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-stone-800/80">
          
          <div className="text-center md:text-left">
            <h4 className="font-serif text-3xl font-bold text-white tracking-tight">
              Beauty Abyssi Nail
            </h4>
            <p className="text-xs text-brand-300 mt-1 uppercase tracking-widest font-semibold">
              Pretty Nails • Happy You
            </p>
            <p className="text-xs text-stone-400 mt-2 max-w-sm">
              Certified salon-grade nail artistry for Hand & Leg care. Exclusively serving Kombolcha city, nearby cities (e.g. Dessie) & all surrounding villages (e.g. Shisha Ber).
            </p>
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-amber-300/90 font-medium mt-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Kombolcha, Dessie & Surrounding Areas</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
            <a
              href="https://t.me/Bonkersss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] border border-[#229ED9]/40 px-4 py-2.5 rounded-full transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram: @Bonkersss</span>
            </a>

            <a
              href="tel:+251956645851"
              className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 px-4 py-2.5 rounded-full transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              <span>+251 95 664 5851</span>
            </a>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <p className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} Beauty Abyssi Nail. Handcrafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for perfection.</span>
          </p>

          <div className="flex items-center gap-5">
            <Link
              to="/help"
              className="text-stone-400 hover:text-stone-200 transition-colors"
            >
              How to Book & FAQ
            </Link>

            <Link
              to="/help?tab=history"
              className="text-stone-400 hover:text-stone-200 transition-colors"
            >
              My Bookings
            </Link>

            <Link
              to="/admin"
              className="text-stone-500 hover:text-stone-300 transition-colors flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Artist Portal</span>
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
