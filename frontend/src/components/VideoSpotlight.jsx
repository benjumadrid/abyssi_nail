import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function VideoSpotlight({ onOpenBooking, onScrollToInspo }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen();
    }
  };

  return (
    <section id="videoShowcase" className="relative py-16 bg-gradient-to-b from-white via-[#faf6f3] to-white border-y border-stone-200/70 overflow-hidden">
      
      {/* Decorative ambient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-amber-200/25 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Phone / Reel Luxury Video Player (9:16 portrait) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[340px]">
              
              {/* Outer Phone / Salon Frame with Gold-Bronze Trim */}
              <div className="relative rounded-[2.75rem] p-2.5 bg-gradient-to-b from-stone-900 via-stone-800 to-stone-950 shadow-2xl border-2 border-amber-400/40">
                
                {/* Speaker / Camera Notch */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-stone-950 rounded-full z-20 flex items-center justify-center gap-1.5 shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-stone-800"></div>
                  <div className="w-8 h-1 rounded-full bg-stone-800"></div>
                </div>

                {/* Inner Video Container */}
                <div className="relative aspect-[9/16] rounded-[2.25rem] overflow-hidden bg-black group shadow-inner">
                  
                  <video
                    ref={videoRef}
                    src="/abyssi_nail_art_promo.mp4"
                    poster="/uploads/cat-eye.jpg"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Top Live Badge */}
                  <div className="absolute top-8 left-4 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-[11px] font-semibold text-white">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>Studio Reel</span>
                  </div>

                  {/* Gradient bottom overlay for controls readability */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>

                  {/* On-screen playback interactive controls */}
                  <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between text-white">
                    
                    {/* Play / Pause toggle */}
                    <button
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pause video' : 'Play video'}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all border border-white/25 active:scale-95"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-white text-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      )}
                    </button>

                    {/* Right side controls: Sound and Fullscreen */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all border border-white/25 active:scale-95"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-white" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>

                      <button
                        onClick={handleFullscreen}
                        aria-label="Fullscreen"
                        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all border border-white/25 active:scale-95"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4 text-white" />
                      </button>
                    </div>

                  </div>

                </div>
              </div>

              {/* Decorative floating label badge below phone */}
              <div className="mt-4 text-center">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Real Client Treatment • 100% Authentic</span>
                </span>
              </div>

            </div>
          </div>

          {/* Right Column: Editorial Showcase & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 px-4 py-1.5 rounded-full text-xs font-bold text-brand-800">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Artistry In Motion</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
              Flawless Polish, <br />
              <span className="italic font-normal text-brand-600">Unmatched Brilliance.</span>
            </h2>

            <p className="text-stone-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              See the genuine shine, ultra-smooth cuticle contouring, and mirror gloss that goes into every single nail design. No filters, no stock footage — just master-level care crafted uniquely for you.
            </p>

            {/* Highlights List */}
            <div className="space-y-3.5 pt-2 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-start gap-3.5 text-left bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Custom Sculpting & Natural Apex</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Every tip is contoured to complement your natural nail bed for maximum strength and elegance.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 text-left bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0 text-brand-600">
                  <ShieldCheck className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Premium High-Retention Gel Finish</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Zero chipping, zero peeling — retains glass-like brilliance and shine for 3+ weeks.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 text-left bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600">
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Punctual Appointments, Zero Wait Time</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Private, 1-on-1 dedicated session with no rushed steps and no scheduling delays.</p>
                </div>
              </div>
            </div>

            {/* Direct Call to Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <button
                onClick={() => onOpenBooking()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-stone-900 hover:bg-brand-700 text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                <span>Book This Look</span>
                <ArrowRight className="w-4 h-4 text-brand-300" />
              </button>

              <button
                onClick={onScrollToInspo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs transition-all"
              >
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Custom Inspo Request</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
