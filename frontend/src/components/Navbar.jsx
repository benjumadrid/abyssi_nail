import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Calendar, Lock, Clock, HelpCircle, Home as HomeIcon, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar({ onOpenBooking, onCategorySelect, onScrollToInspo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = location.pathname === '/' || location.pathname === '/services' || location.pathname === '/hand' || location.pathname === '/pedicure' || location.pathname === '/inspo';
  const isHelp = location.pathname === '/help' || location.pathname === '/my-bookings';
  const isHistory = location.pathname === '/my-bookings' || (location.pathname === '/help' && location.search.includes('history'));

  const handleHomeClick = (e) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === '/' && !location.search) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onCategorySelect?.('all');
    } else {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (category) => {
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      onCategorySelect?.(category);
      navigate(category === 'all' ? '/services' : category === 'Hand' ? '/hand' : '/pedicure');
      const el = document.getElementById('servicesSection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(category === 'all' ? '/services' : category === 'Hand' ? '/hand' : '/pedicure');
    }
  };

  const handleInspoClick = () => {
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      onScrollToInspo?.();
      navigate('/inspo');
      const el = document.getElementById('inspoSection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/inspo');
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Home Link */}
        <Link 
          to="/" 
          onClick={handleHomeClick} 
          className="flex items-center gap-3 group cursor-pointer" 
          title="Return to Top of Home"
        >
          <div className="w-12 h-12 rounded-full border-2 border-brand-400 p-0.5 overflow-hidden bg-brand-50 shadow-inner group-hover:scale-105 transition-transform">
            <img 
              src="/uploads/brand-logo.jpg" 
              alt="Beauty Abyssi" 
              className="w-full h-full object-cover rounded-full" 
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 block leading-tight">
              Beauty Abyssi
            </span>
            <span className="text-[10px] uppercase tracking-widest text-brand-600 font-semibold block">
              Pretty Nails • Happy You
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-600">
          <button 
            type="button"
            onClick={handleHomeClick} 
            className={`hover:text-brand-600 transition-colors flex items-center gap-1.5 cursor-pointer ${isHome && !location.search && location.pathname === '/' ? 'text-brand-700 font-bold' : ''}`}
            title="Return to Home"
          >
            <HomeIcon className="w-3.5 h-3.5 text-stone-500" />
            <span>Home</span>
          </button>

          <button 
            type="button"
            onClick={() => handleCategoryClick('all')} 
            className={`hover:text-brand-600 transition-colors cursor-pointer ${location.pathname === '/services' ? 'text-brand-700 font-bold' : ''}`}
          >
            All Treatments
          </button>

          <button 
            type="button"
            onClick={() => handleCategoryClick('Hand')} 
            className={`hover:text-brand-600 transition-colors flex items-center gap-1.5 cursor-pointer ${location.pathname === '/hand' ? 'text-brand-700 font-bold' : ''}`}
          >
            <span>Hand</span>
          </button>

          <button 
            type="button"
            onClick={() => handleCategoryClick('Leg')} 
            className={`hover:text-brand-600 transition-colors flex items-center gap-1.5 cursor-pointer ${location.pathname === '/pedicure' ? 'text-brand-700 font-bold' : ''}`}
          >
            <span>Pedicure</span>
          </button>

          <button 
            type="button"
            onClick={handleInspoClick} 
            className={`hover:text-brand-600 transition-colors flex items-center gap-1 cursor-pointer ${location.pathname === '/inspo' ? 'text-brand-700 font-bold' : ''}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Custom Inspo</span>
          </button>

          <Link 
            to="/help" 
            className={`hover:text-brand-600 transition-colors flex items-center gap-1 ${isHelp && !isHistory ? 'text-brand-700 font-bold' : ''}`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
            <span>Help Center</span>
          </Link>

          <Link 
            to="/my-bookings" 
            className={`hover:text-brand-600 transition-colors flex items-center gap-1 font-semibold ${isHistory ? 'text-brand-700 font-bold' : 'text-stone-800'}`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>My Bookings</span>
          </Link>
        </nav>

        {/* Action Buttons & Mobile Hamburger Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              closeMenu();
              onOpenBooking();
            }}
            className="inline-flex items-center gap-2 bg-stone-900 hover:bg-brand-700 text-white px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold tracking-wide shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <Calendar className="w-3.5 h-3.5 text-brand-300" />
            <span>Book / Register</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-stone-900" /> : <Menu className="w-5 h-5 text-stone-900" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 border-b border-stone-200 shadow-xl px-5 py-5 space-y-2 animate-fadeIn transition-all">
          <button
            type="button"
            onClick={handleHomeClick}
            className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
              isHome && !location.search && location.pathname === '/' ? 'bg-amber-100 text-amber-950 font-extrabold' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <HomeIcon className="w-4 h-4 text-stone-500" />
              <span>Home</span>
            </span>
            <ArrowRight className="w-3 h-3 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => handleCategoryClick('all')}
            className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
              location.pathname === '/services' ? 'bg-amber-100 text-amber-950 font-extrabold' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>All Treatments</span>
            </span>
            <ArrowRight className="w-3 h-3 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => handleCategoryClick('Hand')}
            className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
              location.pathname === '/hand' ? 'bg-amber-100 text-amber-950 font-extrabold' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              <span>Hand Nail Art</span>
            </span>
            <ArrowRight className="w-3 h-3 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => handleCategoryClick('Leg')}
            className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
              location.pathname === '/pedicure' ? 'bg-amber-100 text-amber-950 font-extrabold' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pedicure Art</span>
            </span>
            <ArrowRight className="w-3 h-3 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={handleInspoClick}
            className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
              location.pathname === '/inspo' ? 'bg-amber-100 text-amber-950 font-extrabold' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Custom Inspo Showcase</span>
            </span>
            <ArrowRight className="w-3 h-3 text-stone-400" />
          </button>

          <Link
            to="/help"
            onClick={closeMenu}
            className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
              isHelp && !isHistory ? 'bg-amber-100 text-amber-950 font-extrabold' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-brand-600" />
              <span>Help Center & FAQ</span>
            </span>
            <ArrowRight className="w-3 h-3 text-stone-400" />
          </Link>

          <Link
            to="/my-bookings"
            onClick={closeMenu}
            className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
              isHistory ? 'bg-amber-100 text-amber-950 font-extrabold' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>My Booking History</span>
            </span>
            <ArrowRight className="w-3 h-3 text-stone-400" />
          </Link>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between px-2">
            <Link
              to="/admin"
              onClick={closeMenu}
              className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 text-xs font-semibold py-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Artist Portal Login</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
