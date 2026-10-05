import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Phone, Send, RefreshCw, Clock, CheckCircle2, ShieldCheck, Heart, MapPin, Lock } from 'lucide-react';

export default function MaintenancePage({ onRefresh }) {
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState('');

  const handleCheck = async () => {
    setChecking(true);
    setCheckMessage('');
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setTimeout(() => {
        setChecking(false);
        setCheckMessage('Still cooking our fresh updates! Please check back in a few moments.');
      }, 700);
    } catch {
      setChecking(false);
      setCheckMessage('Still cooking our fresh updates! Please check back in a few moments.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0A09] text-stone-100 flex flex-col justify-between selection:bg-amber-400 selection:text-stone-950 relative overflow-hidden font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-amber-500/15 via-rose-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-amber-600/5 blur-3xl pointer-events-none" />

      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="w-full border-b border-stone-800/80 bg-stone-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-stone-950 fill-stone-950" />
            </div>
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white block leading-tight">
                Beauty Abyssi
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300/90 tracking-widest uppercase block">
                Nail Art & Pedicure House
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold">System Update In Progress</span>
          </div>

        </div>
      </header>

      {/* ── Main Content Area ──────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 relative z-10">
        <div className="w-full max-w-2xl mx-auto text-center space-y-8">
          
          {/* Hero Icon with Golden Aura */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-400/25 to-rose-400/20 blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-3xl bg-stone-900 border-2 border-amber-400/40 flex items-center justify-center shadow-2xl">
              <span className="text-4xl sm:text-5xl select-none animate-bounce">
                💅
              </span>
            </div>
          </div>

          {/* Headings */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-amber-300 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>We're Cooking Something Special</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              We'll Be Right Back!
            </h1>

            <p className="text-stone-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              We are currently upgrading Beauty Abyssi with new nail art designs, seasonal styles, and an even faster booking experience.
            </p>
          </div>

          {/* Reassurance Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left max-w-xl mx-auto">
            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Bookings Are Safe</h4>
                <p className="text-[11px] text-stone-400 mt-0.5 leading-normal">
                  All confirmed appointments and client data remain secure and untouched.
                </p>
              </div>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Urgent Bookings</h4>
                <p className="text-[11px] text-stone-400 mt-0.5 leading-normal">
                  Need a same-day set? Contact the artist directly on Telegram or phone!
                </p>
              </div>
            </div>
          </div>

          {/* Direct Artist Contact Options */}
          <div className="bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border-2 border-amber-400/30 rounded-3xl p-6 max-w-xl mx-auto text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Direct Artist Contact</span>
              </span>
              <span className="text-[10px] font-semibold text-stone-400 bg-stone-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>Kombolcha & Dessie</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://t.me/Bonkersss"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#229ED9] hover:bg-[#1a8dc3] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram: @Bonkersss</span>
              </a>

              <a
                href="tel:+251956645851"
                className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call: +251 95 664 5851</span>
              </a>
            </div>
          </div>

          {/* Interactive Check Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking}
              className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all border border-stone-700 shadow-md active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-amber-400' : ''}`} />
              <span>{checking ? 'Checking Status...' : "Check If We're Back"}</span>
            </button>

            {checkMessage && (
              <p className="text-xs text-amber-300/90 font-medium animate-fadeIn">
                {checkMessage}
              </p>
            )}
          </div>

        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-stone-800/60 bg-stone-950/80 py-4 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} Beauty Abyssi. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-stone-400 hover:text-amber-300 transition-colors text-xs font-semibold"
            >
              <Lock className="w-3 h-3" />
              <span>Artist Portal Login</span>
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
