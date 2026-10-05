import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Sparkles, Calendar, Clock, Phone, Send, CheckCircle2, 
  ChevronDown, ChevronUp, Search, ArrowRight, ShieldCheck, 
  Heart, HelpCircle, AlertCircle, RefreshCw, FileText, Image as ImageIcon,
  Trash2, ArrowLeft, MapPin
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';
import ImageModal from '../components/ImageModal';

const FAQS = [
  {
    question: "Where are you located, and which areas do you serve?",
    answer: "Beauty Abyssi is based in Kombolcha (Ethiopia)! Our nail artist serves Kombolcha city, nearby cities (such as Dessie), and all surrounding villages and neighborhoods (such as Shisha Ber). When booking your appointment, please enter your city and area (e.g. 'Kombolcha, Shisha Ber' or 'Dessie') so we can plan your session smoothly."
  },
  {
    question: "How is pricing determined for treatments and custom designs?",
    answer: "Pricing is personalized and negotiated based on nail length, chosen shape (almond, coffin, square, stiletto), complexity of hand-painted artwork, and product selection (Gel polish vs. Full Acrylic sculpture). This ensures you only pay for what you receive, with fair and honest consultation."
  },
  {
    question: "Can I bring my own custom design from Pinterest, TikTok, or Instagram?",
    answer: "Yes, absolutely! You can attach your inspiration photo directly in the online booking form or send the screenshot straight to our Telegram (@Bonkersss). We will review your photo, match the colors, charms, and chrome finishes, and discuss your exact vision."
  },
  {
    question: "How do I register for the Group Discount (3+ guests)?",
    answer: "Registering for our exclusive Group Discount takes less than a minute:\n\n1. Click the 'Book / Register' button in the top menu or on any nail treatment.\n2. In the booking popup, switch ON the toggle: 'Wedding / Bridal / Group Discount (3+ Guests)'.\n3. Select your group size (minimum 3 people, up to 15 guests).\n4. Choose the nail treatments you and your group desire (Gel, Acrylic, Pedicure, or Custom Inspo).\n5. Pick your preferred appointment date & time for the session.\n6. Fill in the Group Guest Details:\n   • Guest 1 (Lead Organizer / Host): Enter your Full Name, Phone Number, and Address.\n   • Group Members (Guest 2, 3, etc.): Enter each guest's Full Name and Phone Number so the salon can coordinate with everyone.\n   • Venue / Location: If everyone is getting serviced together at the same place, simply check 'Same location/venue for all guests', or specify separate addresses if needed.\n7. Click 'Submit Booking'!\n\n✨ Once submitted, your booking is automatically registered with exclusive VIP group discount pricing! Our artist receives an instant notification with the full group roster on Telegram and will reach out to confirm your group's schedule and finalize your discounted package.",
    action: "openBooking"
  },
  {
    question: "Are there special discounts for Wedding & Bridal groups?",
    answer: "Yes, absolutely! We love hosting bridal parties and celebration groups. Parties of 3 or more guests automatically qualify for our discounted rates, complimentary nail preps, coordinated styling themes, and dedicated back-to-back appointment slots so nobody waits. For large weddings or out-of-salon house visits in Kombolcha, Dessie, and surrounding areas, reach out directly on Telegram (@Bonkersss) or call us!"
  },
  {
    question: "What is the Punctuality & Zero-Delay Policy?",
    answer: "Every appointment is reserved exclusively for you in a private, 1-on-1 session with dedicated attention and zero waiting time. We ask clients to arrive 5–10 minutes prior to their slot. If you need to reschedule, please notify our salon on Telegram at least 2 hours in advance."
  },
  {
    question: "What hygiene and sanitation standards are practiced?",
    answer: "Hygiene is our highest priority. All metal tools undergo 100% medical-grade sterilization between every client, disposable single-use nail files and buffers are used, and the entire workstation is disinfected with hospital-grade sanitizers."
  },
  {
    question: "How do I cancel or reschedule an existing appointment?",
    answer: "You can easily reschedule or cancel by messaging us directly on Telegram (@Bonkersss) or calling +251 956 645 851. Provide your name or booking date and we will help you pick a new open slot."
  }
];

export default function Help({ defaultTab = null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = defaultTab || (searchParams.get('tab') === 'history' ? 'history' : 'guide');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Booking history state - always clear / empty by default until user types
  const [phoneQuery, setPhoneQuery] = useState('');
  const phoneQueryRef = useRef('');

  useEffect(() => {
    phoneQueryRef.current = phoneQuery;
  }, [phoneQuery]);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);

  // Modals state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomUrl, setZoomUrl] = useState('');
  const [zoomTitle, setZoomTitle] = useState('');

  // Synchronize tab immediately whenever navigation changes ?tab=...
  useEffect(() => {
    const tab = defaultTab || searchParams.get('tab');
    if (tab === 'history') {
      setActiveTab('history');
      const savedPhone = localStorage.getItem('abyssi_client_phone') || '';
      if (savedPhone) {
        setPhoneQuery(savedPhone);
        fetchHistory(savedPhone);
      }
    } else if (tab === 'guide' || !tab) {
      setActiveTab('guide');
    }
  }, [searchParams, defaultTab]);

  // Initial mount: load services and restore client's own history only if booked on this device
  useEffect(() => {
    if (initialTab === 'history') {
      const savedPhone = localStorage.getItem('abyssi_client_phone') || '';
      if (savedPhone) {
        setPhoneQuery(savedPhone);
        fetchHistory(savedPhone);
      }
    }

    // Fetch services for booking modal
    axios.get('/api/services').then(res => {
      if (res.data.success) setServices(res.data.data);
    }).catch(() => {});
  }, []);

  // Live real-time synchronization via Server-Sent Events (SSE) & silent polling
  // Instantly reflects cancellations, reasons, and status updates without requiring manual refresh
  useEffect(() => {
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/registrations/stream');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'order_updated') {
            const updated = data.order;
            setHistoryList(prev => prev.map(item => {
              if (item.id === updated.id) {
                return {
                  ...item,
                  ...updated,
                  cancellation_reason: updated.cancellation_reason !== undefined ? updated.cancellation_reason : item.cancellation_reason,
                  status: updated.status,
                  negotiated_price: updated.negotiated_price !== undefined ? updated.negotiated_price : item.negotiated_price,
                };
              }
              return item;
            }));
          } else if (data.type === 'order_deleted') {
            setHistoryList(prev => prev.filter(item => item.id !== data.id));
          } else if (data.type === 'new_registration') {
            const newOrder = data.order;
            const currentFilter = phoneQueryRef.current ? phoneQueryRef.current.trim() : '';
            if (!currentFilter || (newOrder.client_phone && newOrder.client_phone.includes(currentFilter))) {
              setHistoryList(prev => {
                if (prev.some(o => o.id === newOrder.id)) return prev;
                return [newOrder, ...prev];
              });
            }
          }
        } catch (err) {
          console.warn('[Client SSE] Error parsing live update:', err);
        }
      };

      eventSource.onerror = () => {
        // Native EventSource auto-reconnects on disconnection
      };
    } catch (err) {
      console.warn('[Client SSE] Failed to connect to stream:', err);
    }

    // Silent background poll every 4 seconds only if a phone number is actively being queried
    const pollInterval = setInterval(() => {
      if (activeTab === 'history') {
        const currentTarget = phoneQueryRef.current;
        if (currentTarget && currentTarget.trim() !== '') {
          const url = `/api/registrations/history?phone=${encodeURIComponent(currentTarget.trim())}`;
          axios.get(url).then(res => {
            if (res.data?.success) {
              setHistoryList(res.data.data);
            }
          }).catch(() => {});
        }
      }
    }, 4000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'history' ? { tab: 'history' } : {});
    if (tab === 'history' && !hasSearched && phoneQuery) {
      fetchHistory(phoneQuery);
    }
  };

  const fetchHistory = async (phoneToSearch, isSilent = false) => {
    const target = phoneToSearch !== undefined ? phoneToSearch : phoneQuery;

    if (!target || target.trim() === '') {
      setHistoryList([]);
      setHistoryLoading(false);
      setHasSearched(false);
      return;
    }

    if (!isSilent) {
      setSearchError('');
      setHistoryLoading(true);
      setHasSearched(true);
      setShowAllHistory(false);
    }

    try {
      const url = `/api/registrations/history?phone=${encodeURIComponent(target.trim())}`;

      const res = await axios.get(url);
      if (res.data.success) {
        setHistoryList(res.data.data);
      } else if (!isSilent) {
        setSearchError(res.data.message || 'Could not retrieve bookings.');
      }
    } catch (err) {
      if (!isSilent) {
        setSearchError(err.response?.data?.message || 'Error fetching your booking history. Please try again.');
      }
    } finally {
      if (!isSilent) {
        setHistoryLoading(false);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDeleteTargeted = async (id) => {
    try {
      const res = await axios.delete(`/api/registrations/${id}?phone=${encodeURIComponent(phoneQuery)}`);
      if (res.data.success) {
        setHistoryList(prev => prev.filter(item => item.id !== id));
        setActionSuccess(`Booking #${id} was deleted successfully.`);
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting booking.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      const res = await axios.delete(`/api/registrations/history/all?phone=${encodeURIComponent(phoneQuery)}`);
      if (res.data.success) {
        setHistoryList([]);
        try {
          localStorage.removeItem('abyssi_client_phone');
          localStorage.removeItem('abyssi_client_name');
        } catch (e) {}
        setActionSuccess('All your booking records have been deleted and cleared.');
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error clearing history.');
    } finally {
      setClearAllConfirm(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Confirmed & Reserved</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-[11px] font-bold px-3 py-1 rounded-full border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Cancelled</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f5]">
      
      {/* Top Banner */}
      <div className="bg-stone-900 text-amber-200 text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Beauty Abyssi Client Help & Support Hub</span>
        <span className="hidden sm:inline text-stone-400">• Direct Telegram: @Bonkersss</span>
      </div>

      <Navbar
        onOpenBooking={() => setBookingOpen(true)}
      />

      {/* Return to Home Bar */}
      <div className="bg-[#f5ede7] px-4 sm:px-6 lg:px-8 pt-4 pb-1">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-brand-700 bg-white/90 hover:bg-white px-4 py-2 rounded-full border border-stone-200 shadow-xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-brand-600" />
            <span>← Back to Home / Services Catalog</span>
          </Link>
          <span className="text-[11px] text-stone-500 hidden sm:inline">
            Pretty Nails • Happy You
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#f5ede7] to-[#faf7f5] py-12 sm:py-16 border-b border-stone-200/70 text-center px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-xs font-bold text-brand-700 border border-brand-200 shadow-xs">
            <HelpCircle className="w-4 h-4 text-brand-600" />
            <span>Client Support & Booking Assistance</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight">
            How Can We Help You?
          </h1>

          <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Learn step-by-step how to reserve your nail appointment, bring custom inspiration photos, or look up your last 5 booking records anytime.
          </p>

          {/* Luxury Tab Switcher */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex p-1.5 bg-stone-200/80 rounded-full border border-stone-300 shadow-inner">
              <button
                onClick={() => handleTabChange('guide')}
                className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'guide'
                    ? 'bg-stone-950 text-white shadow-md'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>How to Book & FAQ</span>
              </button>

              <button
                onClick={() => handleTabChange('history')}
                className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-stone-950 text-white shadow-md'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>My Booking History (Last 5)</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">

        {/* TAB 1: HOW TO BOOK & FAQ */}
        {activeTab === 'guide' && (
          <div className="space-y-16">
            
            {/* 4-Step Visual Booking Walkthrough */}
            <div>
              <div className="text-center mb-10">
                <span className="text-[11px] uppercase tracking-widest text-brand-600 font-bold block mb-1">
                  Simple & Clear Process
                </span>
                <h2 className="font-serif text-3xl font-bold text-stone-900">
                  How to Make an Appointment in 4 Steps
                </h2>
                <p className="text-stone-600 text-sm max-w-xl mx-auto mt-2">
                  Booking is 100% free with zero delay. Follow these 4 quick steps to lock in your spot.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Step 1 */}
                <div className="bg-white rounded-3xl p-6 border-2 border-stone-200/80 hover:border-amber-400/70 transition-all shadow-xs hover:shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-9 h-9 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 font-serif font-bold text-lg flex items-center justify-center">
                        1
                      </span>
                      <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        Cards or Inspo
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">
                      Choose Your Treatment
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed space-y-1">
                      <span>Browse our salon cards for <strong>Hand Care</strong> (Cat Eye, Gel Nails, Acrylics, French Tip, Repair...) or <strong>Leg Care</strong> (Classic Pedicure, Spa Pedicure, Gel Pedicure...), or bring your own Pinterest / Instagram design.</span>
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <span className="text-[11px] font-semibold text-brand-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>20+ salon services & custom art</span>
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white rounded-3xl p-6 border-2 border-stone-200/80 hover:border-amber-400/70 transition-all shadow-xs hover:shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-serif font-bold text-lg flex items-center justify-center">
                        2
                      </span>
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                        Kombolcha & Dessie
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">
                      Pick Date & Location
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Select your preferred calendar date. Our artist serves <strong>Kombolcha city, nearby cities (e.g. Dessie)</strong>, and all surrounding villages (e.g. Shisha Ber) for dedicated, punctual care.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Zero-wait punctuality</span>
                    </span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white rounded-3xl p-6 border-2 border-stone-200/80 hover:border-amber-400/70 transition-all shadow-xs hover:shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-serif font-bold text-lg flex items-center justify-center">
                        3
                      </span>
                      <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        Contact & Address
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">
                      Enter Details & Location
                    </h3>
                    <div className="text-xs text-stone-600 leading-relaxed space-y-1.5">
                      <p>Provide your name, phone number, and location (e.g. <em>Kombolcha, Shisha Ber or Dessie</em>).</p>
                      <p className="text-[11px] bg-stone-50 p-2 rounded-xl border border-stone-200/70">
                        • <strong>From Cards:</strong> No photo needed! Just submit to reserve.<br />
                        • <strong>Custom Inspo:</strong> Attach your design photo so our artist can prepare your exact polishes & charms.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span>Free online registration</span>
                    </span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 text-white rounded-3xl p-6 border-2 border-amber-400/50 transition-all shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-9 h-9 rounded-2xl bg-amber-400 text-stone-950 font-serif font-bold text-lg flex items-center justify-center shadow-xs">
                        4
                      </span>
                      <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/40">
                        Telegram Link
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-white mb-2">
                      1-Click Telegram Lock
                    </h3>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Upon submission, tap the instant <strong>Telegram button</strong>. It sends your pre-formatted booking details directly to <strong>@Bonkersss</strong> to finalize your appointment!
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-stone-800">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Send className="w-3.5 h-3.5" />
                      <span>Instant direct notification</span>
                    </span>
                  </div>
                </div>

              </div>

              {/* Start Booking Button Banner */}
              <div className="mt-10 p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-stone-900">Ready to pamper your nails?</h4>
                    <p className="text-xs text-stone-500">Pick an open slot now. No credit card required.</p>
                  </div>
                </div>

                <button
                  onClick={() => setBookingOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-brand-700 text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                >
                  <span>Book Appointment Now</span>
                  <ArrowRight className="w-4 h-4 text-brand-300" />
                </button>
              </div>
            </div>

            {/* Direct Contact Hub */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl border border-amber-400/30">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-3 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-3.5 py-1 rounded-full text-xs font-bold border border-amber-400/30">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Direct Artist Channels</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                    Need Help or Want to Message Us Directly?
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
                    Whether you have questions about custom art pricing, bridal packages, or service in Kombolcha, Dessie, and surrounding villages, you can contact our artist directly anytime.
                  </p>
                </div>

                <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
                  <a
                    href="https://t.me/Bonkersss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 bg-[#229ED9] hover:bg-[#1e8dbf] text-white px-6 py-3.5 rounded-2xl text-xs font-bold shadow-md transition-all transform hover:-translate-y-0.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Chat on Telegram (@Bonkersss)</span>
                  </a>

                  <a
                    href="tel:+251956645851"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText('+251956645851').catch(() => {});
                      }
                      setActionSuccess('Connecting call to +251 95 664 5851 (Phone number copied to clipboard!)');
                      setTimeout(() => setActionSuccess(''), 4500);
                    }}
                    title="Call Salon: +251 95 664 5851 (Navigates directly to Phone Call App on mobile)"
                    className="inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/25 px-6 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Call Directly (+251 956 645 851)</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div>
              <div className="text-center mb-8">
                <span className="text-[11px] uppercase tracking-widest text-brand-600 font-bold block mb-1">
                  Got Questions?
                </span>
                <h2 className="font-serif text-3xl font-bold text-stone-900">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="max-w-3xl mx-auto space-y-3">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs transition-all"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 font-serif text-base font-bold text-stone-900 hover:text-brand-700 transition-colors"
                      >
                        <span>{faq.question}</span>
                        <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center shrink-0 text-stone-500">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3 whitespace-pre-line space-y-3">
                          <p>{faq.answer}</p>
                          {faq.action === 'openBooking' && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => setBookingOpen(true)}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Open Group Booking Form Now</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MY BOOKING HISTORY (LAST 5) */}
        {activeTab === 'history' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            
            {/* Phone Lookup Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200/90 shadow-sm">
              <div className="max-w-xl mx-auto text-center space-y-2 mb-6">
                <span className="text-[11px] uppercase tracking-widest text-brand-600 font-bold block">
                  Client Portal
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  Track Your Bookings
                </h2>
                <p className="text-xs text-stone-500">
                  Enter your registered phone number (e.g. 0956645851 or +251...) to see your scheduled sessions and their live confirmation status.
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phoneQuery}
                    onChange={(e) => setPhoneQuery(e.target.value)}
                    placeholder="Enter phone number (e.g. 09...)"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl text-xs font-medium focus:outline-none focus:border-brand-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={historyLoading}
                  className="bg-stone-900 hover:bg-brand-700 disabled:bg-stone-400 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shrink-0"
                >
                  {historyLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Search</span>
                </button>
              </form>

              {searchError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-center gap-2 max-w-md mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}
            </div>

            {/* Results Display */}
            {historyLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="animate-pulse bg-white rounded-3xl h-36 border border-stone-200"></div>
                ))}
              </div>
            ) : hasSearched && historyList.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/90 shadow-xs space-y-4">
                <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-800">No Bookings Found</h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                    We could not find any appointments under <strong>{phoneQuery}</strong>. Make sure you entered the same phone number used during registration.
                  </p>
                </div>
                <button
                  onClick={() => setBookingOpen(true)}
                  className="inline-flex items-center gap-2 bg-stone-900 hover:bg-brand-700 text-white px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-md transition-all"
                >
                  <span>Book Your First Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : !hasSearched && historyList.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/90 shadow-xs space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-500">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-800">Track Your Personal Appointments</h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                    Enter the phone number you registered with above to view your scheduled sessions and live artist confirmations.
                  </p>
                </div>
              </div>
            ) : historyList.length > 0 ? (
              <div className="space-y-4">
                {actionSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{actionSuccess}</span>
                    </div>
                    <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">✕</button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
                  <span className="text-xs font-bold text-stone-600">
                    {historyList.length > 5 && !showAllHistory 
                      ? `Showing latest 5 of ${historyList.length} appointments${phoneQuery ? ` for ${phoneQuery}` : ''}`
                      : `Showing ${historyList.length} appointment${historyList.length > 1 ? 's' : ''}${phoneQuery ? ` for ${phoneQuery}` : ''}`}
                  </span>
                  <div className="flex items-center gap-3">
                    {phoneQuery && (
                      <button
                        onClick={() => {
                          setPhoneQuery('');
                          fetchHistory('');
                        }}
                        className="text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer"
                        title="View latest 5 salon appointments"
                      >
                        View Latest 5
                      </button>
                    )}
                    <button
                      onClick={() => fetchHistory()}
                      className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={() => setClearAllConfirm(true)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full border border-rose-200 transition-colors cursor-pointer"
                      title="Clear all booking records for this phone number"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Clear All History</span>
                    </button>
                  </div>
                </div>

                {(showAllHistory ? historyList : historyList.slice(0, 5)).map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border-2 border-stone-200/90 hover:border-amber-400/70 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                  >
                    {/* Left: Treatment & Details */}
                    {(() => {
                      const inspoPhotos = (item.inspo_image_url || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                      const primaryInspo = inspoPhotos[0] || null;
                      
                      const selectedTreatmentNames = (item.services_selected || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);

                      const treatmentPictures = selectedTreatmentNames.map(name => {
                        const matched = services.find(s => 
                          s.name.trim().toLowerCase() === name.toLowerCase() ||
                          s.name.toLowerCase().includes(name.toLowerCase()) ||
                          name.toLowerCase().includes(s.name.toLowerCase())
                        );
                        return {
                          name,
                          imageUrl: matched?.image_url || null,
                          category: matched?.category || 'Treatment',
                        };
                      });

                      let members = [];
                      try {
                        if (item.group_members) {
                          members = typeof item.group_members === 'string' 
                            ? JSON.parse(item.group_members) 
                            : item.group_members;
                        }
                      } catch (e) {
                        members = [];
                      }

                      return (
                        <div className="flex-1 space-y-3 min-w-0">
                          <div className="flex items-start gap-3 sm:gap-4">
                            {/* Left Thumbnail(s) with zoom - Supports All Booked Treatments */}
                            {primaryInspo ? (
                              <div
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-stone-100 shrink-0 cursor-pointer border-2 border-amber-300 relative group shadow-xs hover:border-amber-400 transition-all"
                                onClick={() => {
                                  setZoomUrl(primaryInspo);
                                  setZoomTitle(`Inspo for Booking #${item.id}`);
                                  setZoomOpen(true);
                                }}
                                title="Click to view full inspo photo"
                              >
                                <img src={primaryInspo} alt="Inspo Reference" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ImageIcon className="w-4 h-4 text-white" />
                                </div>
                                {inspoPhotos.length > 1 && (
                                  <span className="absolute bottom-1 right-1 bg-stone-900/90 text-amber-300 text-[9px] font-bold px-1 rounded">
                                    +{inspoPhotos.length - 1}
                                  </span>
                                )}
                              </div>
                            ) : treatmentPictures.length > 0 && treatmentPictures.some(tp => tp.imageUrl) ? (
                              <div className="flex items-center gap-2 shrink-0">
                                {treatmentPictures.map((tp, tpIdx) => (
                                  <div
                                    key={tpIdx}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-stone-100 shrink-0 cursor-pointer border-2 border-amber-300/90 hover:border-amber-400 relative group shadow-xs transition-all"
                                    onClick={() => {
                                      if (tp.imageUrl) {
                                        setZoomUrl(tp.imageUrl);
                                        setZoomTitle(`${tp.name} (${item.client_name})`);
                                        setZoomOpen(true);
                                      }
                                    }}
                                    title={`Click to view ${tp.name}`}
                                  >
                                    {tp.imageUrl ? (
                                      <img src={tp.imageUrl} alt={tp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                      <div className="w-full h-full bg-amber-50 flex items-center justify-center text-amber-600">
                                        <Sparkles className="w-6 h-6" />
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ImageIcon className="w-4 h-4 text-white" />
                                    </div>
                                    {treatmentPictures.length > 1 && (
                                      <span className="absolute bottom-1 right-1 bg-stone-900/90 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                                        #{tpIdx + 1}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                                <Sparkles className="w-7 h-7" />
                              </div>
                            )}

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                                  #{item.id}
                                </span>
                                {getStatusBadge(item.status)}
                                {item.is_wedding_or_group && (
                                  <span className="bg-gradient-to-r from-amber-100 to-rose-100 text-amber-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-2xs">
                                    👑 VIP Group Discount ({item.group_size || (members.length > 0 ? members.length : 3)} Guests)
                                  </span>
                                )}
                              </div>

                              <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                                {item.services_selected || 'Custom Nail Care'}
                              </h3>

                              {treatmentPictures.length > 1 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  {treatmentPictures.map((tp, tpIdx) => (
                                    <span
                                      key={tpIdx}
                                      onClick={() => {
                                        if (tp.imageUrl) {
                                          setZoomUrl(tp.imageUrl);
                                          setZoomTitle(`${tp.name} Art`);
                                          setZoomOpen(true);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 bg-stone-100 hover:bg-amber-100/70 text-stone-800 px-2 py-0.5 rounded-lg border border-stone-200 text-[10px] font-bold cursor-pointer transition-all"
                                      title="Click to zoom picture"
                                    >
                                      {tp.imageUrl && (
                                        <img src={tp.imageUrl} alt={tp.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                                      )}
                                      <span>{tp.name}</span>
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 font-medium pt-0.5">
                                <span className="flex items-center gap-1.5 text-stone-700 font-semibold">
                                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                                  <span>{item.appointment_date}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-stone-700 font-semibold">
                                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                                  <span>{item.client_address || 'Kombolcha'}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-stone-700 font-semibold">
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{item.appointment_time}</span>
                                </span>
                                <span>Category: <strong>{item.category_type || 'Hand'}</strong></span>
                              </div>

                              {item.negotiated_price && (
                                <div className="text-xs font-bold text-emerald-700 pt-0.5">
                                  Agreed Price: {item.negotiated_price} ETB
                                </div>
                              )}

                              {item.notes && (
                                <p className="text-[11px] text-stone-500 italic pt-0.5 line-clamp-1">
                                  "{item.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Group Guests Roster Showcase */}
                          {item.is_wedding_or_group && (
                            <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 rounded-2xl p-3 sm:p-4 border border-amber-300/80 space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                  <span>👑 Group Guest Roster ({item.group_size || (members.length > 0 ? members.length : 3)} Guests)</span>
                                </span>
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                                  Group Discount Applied
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                {(members.length > 0 ? members : [{ name: item.client_name, phone: item.client_phone, address: item.client_address }]).map((m, mIdx) => (
                                  <div key={mIdx} className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs space-y-1 shadow-2xs">
                                    <div className="font-bold text-stone-900 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5 truncate">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold ${mIdx === 0 ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 text-stone-700'}`}>
                                          {mIdx + 1}
                                        </span>
                                        <span className="truncate">{m.name || `Guest ${mIdx + 1}`}</span>
                                      </span>
                                      {mIdx === 0 && (
                                        <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                                          Host
                                        </span>
                                      )}
                                    </div>
                                    {m.phone && (
                                      <div className="text-[11px] text-stone-500 flex items-center gap-1 font-mono">
                                        <Phone className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                        <span className="truncate">{m.phone}</span>
                                      </div>
                                    )}
                                    {m.address && (
                                      <div className="text-[10px] text-stone-600 flex items-center gap-1 truncate">
                                        <MapPin className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                        <span className="truncate">{m.address}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Additional Inspo Photos Gallery (Only shown if more than 1 to prevent duplication of main thumbnail) */}
                          {inspoPhotos.length > 1 && (
                            <div className="bg-amber-50/50 p-2.5 sm:p-3 rounded-2xl border border-amber-300/80 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-amber-950 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>Additional Inspiration Photos ({inspoPhotos.length - 1}):</span>
                                </span>
                                <span className="text-[10px] text-stone-400">Click photo to zoom</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {inspoPhotos.slice(1).map((photoUrl, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-amber-300 relative group cursor-pointer shadow-2xs hover:scale-105 transition-all bg-white shrink-0"
                                    onClick={() => {
                                      setZoomUrl(photoUrl);
                                      setZoomTitle(`Inspo #${pIdx + 2} (Booking #${item.id})`);
                                      setZoomOpen(true);
                                    }}
                                    title="Click to view large fullscreen"
                                  >
                                    <img src={photoUrl} alt={`Inspo #${pIdx + 2}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <ImageIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="absolute bottom-1 right-1 bg-stone-900/80 text-white text-[8px] font-bold px-1 rounded">
                                      #{pIdx + 2}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cancellation Reason Alert if Cancelled */}
                          {item.status === 'cancelled' && (
                            <div className="bg-rose-50/90 border border-rose-200 text-rose-950 rounded-2xl p-3 text-xs flex items-start gap-2.5 mt-2.5 shadow-2xs">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="font-bold uppercase tracking-wider text-[10px] text-rose-800">
                                  Appointment Cancelled by Salon:
                                </div>
                                <div className="font-medium text-stone-900 text-xs leading-relaxed bg-white px-2.5 py-1.5 rounded-xl border border-rose-200/80 mt-1 shadow-2xs">
                                  {item.cancellation_reason || 'Cancelled by salon. Please reach out on Telegram for questions.'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Right: Actions */}
                    <div className="w-full md:w-auto flex md:flex-col items-stretch sm:items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 shrink-0">
                      <a
                        href={item.telegram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1e8dbf] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all text-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Chat on Telegram</span>
                      </a>

                      <div className="flex items-center gap-2 w-full">
                        <a
                          href={item.call_link || "tel:+251956645851"}
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText('+251956645851').catch(() => {});
                            }
                            setActionSuccess('Connecting call to +251 95 664 5851 (Phone number copied to clipboard!)');
                            setTimeout(() => setActionSuccess(''), 4500);
                          }}
                          title="Call Salon Artist: +251 95 664 5851 (Navigates directly to Phone Call App on mobile)"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border border-stone-200 cursor-pointer shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Call (+251 95...)</span>
                        </a>

                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="inline-flex items-center justify-center p-2.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200 cursor-pointer"
                          title="Delete / Cancel this booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}

                {/* Show earlier bookings button if more than 5 */}
                {historyList.length > 5 && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllHistory(prev => !prev)}
                      className="bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-bold text-xs px-6 py-2.5 rounded-full transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>{showAllHistory ? 'Show only latest 5 appointments' : `Show earlier bookings (${historyList.length - 5} more)`}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllHistory ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Targeted Single Delete Confirmation Modal */}
            {deleteConfirmId && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-stone-900">Delete Booking #{deleteConfirmId}?</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Are you sure you want to cancel and delete this appointment? This cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={() => handleDeleteTargeted(deleteConfirmId)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wholly Bulk Clear Confirmation Modal */}
            {clearAllConfirm && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-stone-900">Clear All Booking History?</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      This will permanently delete all {historyList.length} appointment records for phone <strong>{phoneQuery}</strong> and clear your saved phone number.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setClearAllConfirm(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAllHistory}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                    >
                      Clear Everything
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      <Footer />

      {/* Modals */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        services={services}
      />

      <ImageModal
        isOpen={zoomOpen}
        onClose={() => setZoomOpen(false)}
        imageUrl={zoomUrl}
        title={zoomTitle}
      />

    </div>
  );
}
