import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HelpCircle, ArrowRight, Clock, ArrowUp } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import WeddingBanner from '../components/WeddingBanner';
import ServiceCard from '../components/ServiceCard';
import InspoSection from '../components/InspoSection';
import VideoSpotlight from '../components/VideoSpotlight';
import BookingModal from '../components/BookingModal';
import ImageModal from '../components/ImageModal';
import Footer from '../components/Footer';

export default function Home({ defaultCategory = null, defaultSection = null }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState(defaultCategory || 'all');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Modal states
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState(null);
  const [isGroupBooking, setIsGroupBooking] = useState(false);

  // Zoom modal state
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomUrl, setZoomUrl] = useState('');
  const [zoomTitle, setZoomTitle] = useState('');

  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const cat = defaultCategory || searchParams.get('category');
    const sec = defaultSection || searchParams.get('section');
    if (cat) {
      setCurrentCategory(cat);
      setTimeout(() => {
        const el = document.getElementById('servicesSection');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else if (sec === 'inspo') {
      setTimeout(() => {
        const el = document.getElementById('inspoSection');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [searchParams, defaultCategory, defaultSection]);

  const fetchServices = async () => {
    try {
      const res = await axios.get('/api/services');
      if (res.data.success) {
        setServices(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = (serviceName = null, isGroup = false) => {
    setPreselectedService(serviceName);
    setIsGroupBooking(isGroup);
    setBookingOpen(true);
  };

  const handleZoom = (url, title) => {
    setZoomUrl(url);
    setZoomTitle(title);
    setZoomOpen(true);
  };

  const scrollToInspo = () => {
    const el = document.getElementById('inspoSection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredServices = currentCategory === 'all'
    ? services
    : services.filter(s => (s.category || '').toLowerCase() === (currentCategory || '').toLowerCase());

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f5]">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-brand-900 to-stone-900 text-amber-100 text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 shadow-xs">
        <span className="inline-block animate-pulse">✨</span>
        <span><strong>WEDDING & BRIDAL SPECIAL:</strong> Group discounts available for brides, bridesmaids & parties!</span>
        <span className="hidden md:inline text-amber-300 font-semibold">• Negotiated friendly pricing on every custom design</span>
      </div>

      {/* Navbar */}
      <Navbar
        onOpenBooking={() => handleOpenBooking()}
        onCategorySelect={(cat) => setCurrentCategory(cat)}
        onScrollToInspo={scrollToInspo}
      />

      {/* Hero Section */}
      <Hero
        onOpenBooking={() => handleOpenBooking()}
        onScrollToInspo={scrollToInspo}
      />

      {/* Live Video Spotlight Showcase */}
      <VideoSpotlight
        onOpenBooking={() => handleOpenBooking()}
        onScrollToInspo={scrollToInspo}
      />

      {/* Wedding & Group Discount Banner */}
      <WeddingBanner
        onOpenBooking={() => handleOpenBooking(null, true)}
      />

      {/* Filter Tabs & Catalog Section */}
      <section id="servicesSection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6 w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-brand-600 font-bold block mb-1">
              Curated Salon Catalog
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900">
              Our Treatments & Services
            </h2>
          </div>

          {/* Category Toggle Pills */}
          <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-full border border-stone-200/80 shadow-xs">
            <button
              onClick={() => setCurrentCategory('all')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                currentCategory === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCurrentCategory('Hand')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentCategory === 'Hand'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>For Hand</span>
            </button>
            <button
              onClick={() => setCurrentCategory('Leg')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentCategory === 'Leg'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>For Leg (Pedicure)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Service Cards Grid (Nail-Sized Arched Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="animate-pulse bg-white rounded-t-[2.75rem] rounded-b-3xl h-96 border border-stone-200"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onSelect={(name) => handleOpenBooking(name)}
                onZoom={handleZoom}
              />
            ))}
          </div>
        )}
      </section>

      {/* Custom Inspo Section */}
      <InspoSection
        onOpenBooking={(name) => handleOpenBooking(name)}
      />

      {/* Quick Help & Booking Guide Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="bg-gradient-to-r from-[#f7f0eb] via-white to-[#f7f0eb] rounded-3xl p-8 sm:p-10 border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
              <span>First time booking or need help?</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-stone-900">
              Booking Guide & Appointment History
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
              Check out our 4-step registration guide, read pricing & cancellation FAQs, or look up your last 5 scheduled appointments.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              to="/help"
              className="inline-flex items-center gap-2 bg-stone-900 hover:bg-brand-700 text-white px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <span>View How to Book</span>
              <ArrowRight className="w-4 h-4 text-brand-300" />
            </Link>
            <Link
              to="/help?tab=history"
              className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 px-5 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>My Bookings</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        services={services}
        preselectedService={preselectedService}
        isGroupInitial={isGroupBooking}
      />

      <ImageModal
        isOpen={zoomOpen}
        onClose={() => setZoomOpen(false)}
        imageUrl={zoomUrl}
        title={zoomTitle}
      />

      {/* Floating Quick Return to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 bg-stone-900/90 hover:bg-stone-950 text-white px-4 py-3 rounded-full shadow-2xl border border-stone-700/80 hover:scale-105 transition-all flex items-center gap-2 group backdrop-blur-md cursor-pointer animate-fadeIn"
          title="Return to top of page"
        >
          <ArrowUp className="w-4 h-4 text-amber-300 group-hover:-translate-y-0.5 transition-transform" />
          <span className="text-xs font-bold hidden sm:inline">Top</span>
        </button>
      )}

    </div>
  );
}
