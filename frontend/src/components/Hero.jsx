import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Gem, Award, Heart, CheckCircle2, MapPin } from 'lucide-react';

export default function Hero({ onOpenBooking, onScrollToInspo }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f9f3ef] via-[#faf7f5] to-white py-14 sm:py-20 border-b border-stone-200/60">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-10 w-[30rem] h-[30rem] bg-brand-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Content Column */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 bg-white/90 border border-brand-200 px-4 py-1.5 rounded-full text-xs font-bold text-brand-700 shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span>Kombolcha, Dessie & Surrounding Areas • Master Nail Artist</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 leading-[1.12] tracking-tight">
              Your Nails, <br />
              <span className="italic font-normal text-brand-600">Our Passion ❤️</span>
            </h1>

            <p className="text-stone-600 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Experience the pinnacle of Hand and Leg nail artistry. From custom hand-painted art and velvety cat-eye to rejuvenating pedicures, every appointment is timed to perfection with zero delay.
            </p>

            {/* The 4 Trust Pillars from her official brand flyer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs text-center flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="text-[11px] font-bold text-stone-800">Hygienic & Safe</span>
                <span className="text-[9px] text-stone-400">100% Sanitized</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs text-center flex flex-col items-center">
                <Gem className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-[11px] font-bold text-stone-800">High-Quality</span>
                <span className="text-[9px] text-stone-400">Premium OPI / Gel</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs text-center flex flex-col items-center">
                <Award className="w-5 h-5 text-brand-600 mb-1" />
                <span className="text-[11px] font-bold text-stone-800">Certified Artist</span>
                <span className="text-[9px] text-stone-400">Master Level</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs text-center flex flex-col items-center">
                <Heart className="w-5 h-5 text-rose-500 mb-1" />
                <span className="text-[11px] font-bold text-stone-800">Zero Delay</span>
                <span className="text-[9px] text-stone-400">Punctual Care</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <button
                onClick={() => onOpenBooking()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-stone-900 hover:bg-brand-700 text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                <span>Book Your Session</span>
                <ArrowRight className="w-4 h-4 text-brand-300" />
              </button>
              <button
                onClick={onScrollToInspo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 px-7 py-4 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs transition-all"
              >
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Bring Custom Inspo</span>
              </button>
            </div>

          </div>

          {/* Right Hero Image (Clean, larger, no artificial borders) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xl">
              
              {/* Full un-cropped clean photo with gentle rounded corners & natural shadow */}
              <div className="relative aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden shadow-2xl bg-stone-100 group">
                <img
                  src="/uploads/brand-logo.jpg"
                  alt="Beauty Abyssi Nail Salon Studio"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                  onError={(e) => { e.target.src = '/uploads/acrylic-nails.jpg'; }}
                />

                {/* Quick Link to Watch Live Studio Video Reel */}
                <a
                  href="#videoShowcase"
                  className="absolute top-4 right-4 bg-stone-950/80 hover:bg-stone-950 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-2 border border-white/20 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>▶ Watch Studio Reel</span>
                </a>
              </div>

              {/* Floating Review Badge */}
              <div className="absolute -bottom-5 left-4 sm:left-6 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-stone-200/90 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs">
                    <span>★★★★★</span>
                    <span className="text-stone-700 font-bold ml-1 text-xs">Certified Quality</span>
                  </div>
                  <span className="text-[10px] text-stone-500 block">Pretty Nails • Happy You</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
