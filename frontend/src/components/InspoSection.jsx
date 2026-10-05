import React from 'react';
import { Palette, CheckCircle2, Upload, Sparkles } from 'lucide-react';

export default function InspoSection({ onOpenBooking }) {
  return (
    <section id="inspoSection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-gradient-to-br from-white via-brand-50/60 to-white rounded-3xl border-2 border-brand-300/80 p-8 sm:p-12 shadow-xl relative overflow-hidden">
        
        {/* Glow decoration */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand-100/50 blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          <div className="lg:col-span-8 space-y-4">
            
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
              <Palette className="w-3.5 h-3.5" />
              <span>Bring Any Dream Inspo</span>
            </div>

            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-snug">
              Got Inspiration from Pinterest or TikTok? <br />
              <span className="italic font-normal text-brand-700">We Bring Any Nail Art to Life!</span>
            </h3>

            <p className="text-stone-600 text-sm sm:text-base max-w-2xl leading-relaxed">
              Have a screenshot of a design you fell in love with? Don't worry if it's not in the standard catalog! Our certified artist can handcraft and customize <strong>any shape, 3D floral art, chrome reflection, gems, or length</strong> for both hands and feet.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-white px-3.5 py-1.5 rounded-xl border border-stone-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hand & Leg Re-creation
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-white px-3.5 py-1.5 rounded-xl border border-stone-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Bespoke Craftsmanship
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-white px-3.5 py-1.5 rounded-xl border border-stone-200 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Friendly Negotiated Price
              </span>
            </div>

          </div>

          <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center gap-4">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-brand-200 shadow-md">
              <img src="/uploads/brand-flyer.jpg" alt="Beauty Abyssi Poster" className="w-full h-full object-cover" />
            </div>

            <button
              onClick={() => onOpenBooking('Custom Inspo Nail Art')}
              className="bg-stone-900 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-full text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 group"
            >
              <Upload className="w-4 h-4 text-brand-300 group-hover:-translate-y-0.5 transition-transform" />
              <span>Register with Inspo Image</span>
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
