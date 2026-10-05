import React from 'react';
import { ZoomIn, ArrowRight, Sparkles } from 'lucide-react';

export default function ServiceCard({ service, onSelect, onZoom }) {
  const isLeg = service.category === 'Leg';

  return (
    <div className="group relative bg-white rounded-t-[3.5rem] rounded-b-[2rem] border-2 border-stone-200/80 hover:border-amber-400/80 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden hover:-translate-y-1.5">
      
      {/* Top Gold Trim Accent simulating a sculpted nail rim */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300"></div>

      {/* Nail Tip Shaped Image Container with Sculpted Top Arch */}
      <div 
        className="relative aspect-[4/3] bg-stone-100 overflow-hidden cursor-pointer"
        onClick={() => onZoom(service.image_url, service.name)}
      >
        <img
          src={service.image_url}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
          onError={(e) => { e.target.src = '/uploads/cat-eye.jpg'; }}
        />

        {/* Gloss light-streak reflection effect across nail on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

        {/* Distinct Nail Category Badge with miniature Nail Icon */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-bold text-stone-800 shadow-md flex items-center gap-2 border border-amber-200/60">
          <span className="w-2.5 h-3.5 rounded-t-full bg-gradient-to-b from-rose-400 to-rose-600 inline-block shadow-2xs"></span>
          <span>{isLeg ? 'Pedicure Art' : 'Hand Nail Care'}</span>
        </div>

        {/* Top-Right Finish Pill */}
        <div className="absolute top-4 right-4 bg-stone-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow-md">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Gel Gloss</span>
        </div>

        {/* Zoom Hint Overlay */}
        <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          <span className="bg-black/75 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xl border border-white/20">
            <ZoomIn className="w-3.5 h-3.5 text-amber-300" />
            <span>Inspect Artwork</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        
        <div>
          {/* Subtle Nail Motif Tag */}
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-brand-600 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            <span>Beauty Abyssi Signature</span>
          </div>

          <h3 className="font-serif text-2xl font-bold text-stone-900 group-hover:text-brand-700 transition-colors leading-snug">
            {service.name}
          </h3>

          <p className="text-xs text-stone-600 mt-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Card Footer: Price Note & Booking Button */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-semibold">Pricing</span>
            <span className="text-xs font-bold text-stone-800">Negotiable upon design</span>
          </div>

          <button
            onClick={() => onSelect(service.name)}
            className="bg-stone-900 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs hover:shadow-md transform active:scale-95"
          >
            <span>Book</span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-300" />
          </button>
        </div>

      </div>

    </div>
  );
}
