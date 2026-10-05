import React from 'react';
import { Sparkles, Users } from 'lucide-react';

export default function WeddingBanner({ onOpenBooking }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
      <div className="bg-gradient-to-r from-stone-950 via-brand-900 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-brand-500/40 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-amber-300 mb-1">
              Special Celebration Offer
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Bridal Parties & Group Discounts 💍
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mt-1.5 max-w-2xl leading-relaxed">
              Planning a wedding, birthday, graduation, or a girls' day out? We offer special customized group discount rates when booking for multiple hands & pedicures! Select <strong>"Wedding / Group Booking"</strong> in the registration form.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenBooking(null, true)}
          className="shrink-0 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-stone-950 font-bold px-7 py-3.5 rounded-full text-xs uppercase tracking-wider shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <Users className="w-4 h-4 text-stone-950" />
          <span>Claim Group Discount</span>
        </button>

      </div>
    </section>
  );
}
