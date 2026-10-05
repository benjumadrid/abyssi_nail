import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Crown, Lock, LogOut, ArrowLeft, Phone, Send, CheckCircle2, Clock, Calendar, 
  Users, DollarSign, Trash2, ZoomIn, RefreshCw, Sparkles, ExternalLink, MapPin, 
  Image as ImageIcon, ShieldCheck, X, Eye, EyeOff, User, Search, Check, AlertCircle,
  Bell, BellOff, CheckCheck
} from 'lucide-react';
import ImageModal from '../components/ImageModal';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('abyssi_admin_token') || null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  
  // Dashboard state
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications State & Dropdown
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('abyssi_admin_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // Security & Password Change Modal state
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Set browser tab title and green 'A' icon for Admin Portal
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Admin Abyssi Nail House";

    const setFavicon = (iconUrl) => {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/png';
      link.href = iconUrl;
    };

    setFavicon('/admin-favicon.png');

    return () => {
      document.title = "Beauty Abyssi Nail";
      setFavicon('/favicon.png');
    };
  }, []);

  const [currentUsernameInput, setCurrentUsernameInput] = useState('admin');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  // Cancellation Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [selectedPresetReason, setSelectedPresetReason] = useState('');
  const [customReasonDetails, setCustomReasonDetails] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Delete Confirmation Modal state
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Delete All Modal state
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  // Zoom inspo modal
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomUrl, setZoomUrl] = useState('');
  const [zoomTitle, setZoomTitle] = useState('');

  // Toast
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // Format Ethiopian & international phone numbers for direct mobile dialer app opening (RFC 3966)
  const getCleanTel = (phone) => {
    if (!phone) return '#';
    let digits = phone.toString().replace(/[\s\-\(\)\.]/g, '');
    if (digits.startsWith('0')) {
      digits = '+251' + digits.substring(1);
    } else if (digits.startsWith('251')) {
      digits = '+' + digits;
    } else if (!digits.startsWith('+')) {
      if (digits.length === 9) {
        digits = '+251' + digits;
      } else {
        digits = '+' + digits;
      }
    }
    return `tel:${digits}`;
  };

  // Close notification popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Persist notifications
  useEffect(() => {
    try {
      localStorage.setItem('abyssi_admin_notifications', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  // Play subtle high-quality audio chime on new registration
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy or not supported
    }
  };

  // Services catalog for matching pictures
  const [servicesList, setServicesList] = useState([]);

  // Live real-time synchronization (SSE stream + silent background polling)
  useEffect(() => {
    if (!token) return;

    // 1. Initial full fetch
    loadData(true);

    // 2. Real-time Live Sync via Server-Sent Events (SSE)
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/registrations/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_registration') {
            playChime();
            const o = data.order || {};
            const client = o.client_name || 'A customer';
            const srv = o.services_selected || 'Nail Treatment';
            showToast(`🔔 New Live Booking: ${client} registered for ${srv}!`);

            const incomingNotif = {
              id: `notif-${o.id || Date.now()}`,
              orderId: o.id,
              clientName: client,
              phone: o.client_phone || '',
              services: srv,
              date: o.appointment_date,
              time: o.appointment_time,
              notes: o.notes,
              isGroup: !!o.is_wedding_or_group,
              read: false,
              timestamp: new Date().toISOString(),
              message: `New booking: ${client} requested ${srv}`
            };

            setNotifications(prev => [incomingNotif, ...prev.filter(n => n.orderId !== o.id)].slice(0, 50));
            setOrders(prev => [o, ...prev.filter(item => item.id !== o.id)]);
            loadData(false); // Silent live sync
          } else if (data.type === 'order_updated') {
            const updated = data.order;
            setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
          } else if (data.type === 'order_deleted') {
            setOrders(prev => prev.filter(o => o.id !== data.id));
          }
        } catch (err) {
          console.warn('Error parsing SSE event:', err);
        }
      };
      eventSource.onerror = () => {
        // Native EventSource auto-reconnects on disconnection
      };
    } catch (e) {
      console.warn('SSE stream error:', e);
    }

    // 3. Fallback: Silent background poll every 4 seconds to guarantee zero misses
    const pollInterval = setInterval(() => {
      loadData(false);
    }, 4000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, [token]);

  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [ordersRes, statsRes, servicesRes] = await Promise.all([
        axios.get('/api/registrations'),
        axios.get('/api/admin/stats'),
        axios.get('/api/services'),
      ]);

      if (ordersRes.data.success) {
        const fetchedOrders = (ordersRes.data.data || []).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
        setOrders(fetchedOrders);

        // Synchronize unread notifications for any incoming pending orders
        setNotifications(prev => {
          const existingOrderIds = new Set(prev.map(n => n.orderId));
          const newItems = [];
          fetchedOrders.forEach(o => {
            if (!existingOrderIds.has(o.id)) {
              newItems.push({
                id: `notif-${o.id}`,
                orderId: o.id,
                clientName: o.client_name,
                phone: o.client_phone,
                services: o.services_selected,
                date: o.appointment_date,
                time: o.appointment_time,
                notes: o.notes,
                isGroup: !!o.is_wedding_or_group,
                read: o.status !== 'pending',
                timestamp: o.created_at || new Date().toISOString(),
                message: `New booking: ${o.client_name} requested ${o.services_selected || 'Nail Treatment'}`
              });
            }
          });
          if (newItems.length === 0) return prev;
          return [...newItems, ...prev].slice(0, 50);
        });
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      if (servicesRes.data.success) {
        setServicesList(servicesRes.data.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // Notification Helpers
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllNotifsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read');
  };

  const clearAllNotifs = () => {
    setNotifications([]);
    showToast('Notification messages cleared');
  };

  const handleSelectNotification = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setShowNotifDropdown(false);
    if (notif.clientName) {
      setSearchQuery(notif.clientName);
    }
    setFilterStatus('all');
    showToast(`Viewing booking for ${notif.clientName}`);
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const diff = Date.now() - new Date(timestamp).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem('abyssi_admin_token', res.data.token);
        showToast('Welcome back, Beauty Abyssi!');
      } else {
        setLoginError(res.data.message || 'Invalid username or password');
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed. Please check credentials.');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('abyssi_admin_token');
    showToast('Logged out');
  };

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'cancelled') {
      const existing = orders.find(o => o.id === id);
      setCancellingOrderId(id);
      setSelectedPresetReason('');
      setCustomReasonDetails(existing?.cancellation_reason || '');
      setShowCancelModal(true);
      return;
    }
    try {
      const res = await axios.patch(`/api/registrations/${id}`, { status: newStatus, cancellation_reason: null });
      if (res.data.success) {
        showToast(`Status updated to ${newStatus}`);
        loadData(false);
      }
    } catch (err) {
      showToast('Error updating status');
    }
  };

  const handleConfirmCancellation = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!cancellingOrderId) return;
    let reason = '';
    const preset = (selectedPresetReason || '').trim();
    const custom = (customReasonDetails || '').trim();
    if (preset && custom) {
      reason = `${preset}: ${custom}`;
    } else if (custom) {
      reason = custom;
    } else if (preset) {
      reason = preset;
    } else {
      reason = 'Client requested cancellation';
    }

    setCancelSubmitting(true);
    try {
      const res = await axios.patch(`/api/registrations/${cancellingOrderId}`, {
        status: 'cancelled',
        cancellation_reason: reason,
      });
      if (res.data.success) {
        showToast('Appointment cancelled with reason');
        setShowCancelModal(false);
        setCancellingOrderId(null);
        setSelectedPresetReason('');
        setCustomReasonDetails('');
        loadData(false);
      }
    } catch (err) {
      showToast('Error cancelling appointment');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleDeleteAllAppointments = async () => {
    setDeleteAllLoading(true);
    try {
      const res = await axios.delete('/api/registrations/all');
      if (res.data.success) {
        showToast('All appointment records deleted successfully');
        setShowDeleteAllModal(false);
        loadData(false);
      }
    } catch (err) {
      showToast('Error deleting all appointments');
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmOrder) return;
    setDeleteLoading(true);
    try {
      const res = await axios.delete(`/api/registrations/${deleteConfirmOrder.id}`);
      if (res.data.success) {
        showToast(`Appointment #${deleteConfirmOrder.id} deleted successfully`);
        setDeleteConfirmOrder(null);
        loadData(false);
      }
    } catch (err) {
      showToast('Error deleting appointment');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!currentUsernameInput.trim() || !currentPasswordInput.trim() || !newPasswordInput.trim()) {
      setSecurityError('Please fill in all required fields.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setSecurityError('New passwords do not match. Please re-enter carefully.');
      return;
    }

    if (newPasswordInput.length < 6) {
      setSecurityError('New password must be at least 6 characters long.');
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await axios.post('/api/admin/change-password', {
        current_username: currentUsernameInput.trim(),
        current_password: currentPasswordInput.trim(),
        new_password: newPasswordInput.trim(),
      });

      if (res.data.success) {
        setSecuritySuccess('Password updated successfully!');
        showToast('Security credentials updated!');
        setUsername(currentUsernameInput.trim());
        setPassword(newPasswordInput.trim());
        setTimeout(() => {
          setShowSecurityModal(false);
          setCurrentPasswordInput('');
          setNewPasswordInput('');
          setConfirmPasswordInput('');
          setSecuritySuccess('');
        }, 1200);
      } else {
        setSecurityError(res.data.message || 'Failed to update password.');
      }
    } catch (err) {
      setSecurityError(err.response?.data?.message || 'Verification failed. Incorrect current username or password.');
    } finally {
      setSecurityLoading(false);
    }
  };

  // If not logged in, show Login view
  if (!token) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-stone-900/90 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-9 border border-stone-800 shadow-2xl space-y-6 relative z-10">
          
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 mx-auto shadow-lg shadow-amber-500/20">
              <Crown className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div className="inline-block bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-2">
              Beauty Abyssi
            </div>
            <h2 className="font-serif text-3xl font-bold text-white tracking-tight">Artist Executive Portal</h2>
            <p className="text-xs text-stone-400">Sign in to manage client appointments & live orders</p>
          </div>

          {loginError && (
            <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs p-3.5 rounded-2xl text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                placeholder="Enter username"
                autoComplete="off"
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-stone-950/90 border border-stone-800 text-white text-xs font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all placeholder:text-stone-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  value={password}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-stone-950/90 border border-stone-800 text-white text-xs font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all placeholder:text-stone-600"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-300 p-1 transition-colors"
                  tabIndex={-1}
                  aria-label={showLoginPass ? 'Hide password' : 'Show password'}
                >
                  {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 transform active:scale-98 cursor-pointer"
            >
              Enter Dashboard
            </button>
          </form>

          <div className="text-center pt-2">
            <Link to="/" className="text-xs text-stone-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Client Website</span>
            </Link>
          </div>

        </div>

      </div>
    );
  }

  // Filtered Orders with Search
  const filteredOrders = orders.filter(order => {
    // 1. Status Filter
    if (filterStatus === 'groups' && !order.is_wedding_or_group) return false;
    if (filterStatus !== 'all' && filterStatus !== 'groups' && order.status !== filterStatus) return false;

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (order.client_name || '').toLowerCase().includes(q);
      const matchPhone = (order.client_phone || '').includes(q);
      const matchAddress = (order.client_address || '').toLowerCase().includes(q);
      const matchServices = (order.services_selected || '').toLowerCase().includes(q);
      const matchNotes = (order.notes || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchAddress || matchServices || matchNotes;
    }

    return true;
  }).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  return (
    <div className="min-h-screen bg-[#fcfaf8] flex flex-col font-sans">
      
      {/* Top Gold Trim Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200"></div>

      {/* Luxury Obsidian Executive Header */}
      <header className="bg-stone-950 text-white border-b border-stone-800/90 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-16 py-2.5 sm:py-0 sm:h-20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <Link 
              to="/" 
              className="text-stone-400 hover:text-white p-1.5 sm:p-2 rounded-2xl hover:bg-stone-900 border border-transparent hover:border-stone-800 transition-all shrink-0"
              title="Return to client website"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20 shrink-0">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.3]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-400/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-amber-400/20">
                    Executive Portal
                  </span>
                </div>
                <h1 className="font-serif text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-white leading-tight mt-0.5 truncate">
                  Beauty Abyssi Artist Studio
                </h1>
              </div>
            </div>
          </div>

          {/* Action Tools & Live Status */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end ml-auto">
            
            {/* Live Sync Real-Time Status Pill */}
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-[11px] font-bold text-emerald-300 shadow-2xs"
              title="Real-time live sync is active. New client bookings appear instantly without refreshing."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Live Sync Active</span>
              <span className="sm:hidden">Live</span>
            </div>

            {/* Notification Center with Popover Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifDropdown(prev => !prev)}
                className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer relative ${
                  unreadCount > 0
                    ? 'bg-amber-400 text-stone-950 border-amber-300 font-extrabold shadow-md'
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border-stone-800'
                }`}
                title={unreadCount > 0 ? `${unreadCount} new notification(s)` : 'Notification Center'}
              >
                <div className="relative flex items-center">
                  <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-stone-950 animate-bounce' : 'text-amber-400'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                    </span>
                  )}
                </div>
                
                <span className="font-bold">Alerts</span>
                
                {unreadCount > 0 && (
                  <span className="bg-stone-950 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-84 sm:w-[420px] bg-stone-950 border border-stone-800 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] z-50 overflow-hidden text-stone-100 ring-1 ring-amber-400/20 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Dropdown Header */}
                  <div className="p-4 border-b border-stone-800/90 flex items-center justify-between bg-stone-900/95">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-xs">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-white">Client Booking Alerts</h4>
                        <span className="text-[11px] text-amber-300/80 font-medium">
                          {unreadCount > 0 ? `${unreadCount} new unread booking request${unreadCount > 1 ? 's' : ''}` : 'All notifications caught up'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotifsAsRead}
                          className="text-[10px] font-extrabold text-stone-950 hover:text-stone-900 transition-all flex items-center gap-1 cursor-pointer bg-amber-400 hover:bg-amber-300 px-2.5 py-1 rounded-xl shadow-xs"
                          title="Mark all notifications as read"
                        >
                          <CheckCheck className="w-3 h-3 stroke-[2.5]" />
                          <span>Mark Read</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllNotifs}
                          className="text-[10px] text-stone-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-stone-800"
                          title="Clear notification list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Message List */}
                  <div className="max-h-96 overflow-y-auto divide-y divide-stone-850 bg-stone-950">
                    {notifications.length === 0 ? (
                      <div className="py-10 px-4 text-center space-y-2 bg-stone-950">
                        <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500 mx-auto shadow-inner">
                          <BellOff className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-stone-200">No New Notifications</p>
                        <p className="text-[11px] text-stone-500 max-w-[220px] mx-auto">
                          Incoming client bookings and inspo requests will appear here instantly.
                        </p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => handleSelectNotification(notif)}
                          className={`p-3.5 sm:p-4 transition-all cursor-pointer flex items-start gap-3 relative group ${
                            !notif.read 
                              ? 'bg-gradient-to-r from-amber-950/40 via-stone-900/90 to-stone-950 border-l-4 border-l-amber-400 hover:bg-stone-850' 
                              : 'bg-stone-950 hover:bg-stone-900/90'
                          }`}
                        >
                          {/* Indicator Dot */}
                          <div className="mt-1.5 shrink-0">
                            {!notif.read ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block shadow-sm shadow-amber-400/90 animate-pulse" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-stone-700 block" />
                            )}
                          </div>

                          {/* Avatar Initials */}
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-serif font-black text-sm shrink-0 shadow-xs ${
                            !notif.read 
                              ? 'bg-amber-400 text-stone-950 shadow-amber-400/20' 
                              : 'bg-stone-850 text-stone-300 border border-stone-750'
                          }`}>
                            {(notif.clientName || 'C').charAt(0).toUpperCase()}
                          </div>

                          {/* Message Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="font-serif font-bold text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                                {notif.clientName}
                              </h5>
                              <span className="text-[10px] font-semibold text-stone-400 shrink-0 bg-stone-900 px-2 py-0.5 rounded-md border border-stone-800">
                                {formatRelativeTime(notif.timestamp)}
                              </span>
                            </div>

                            <p className="text-xs text-amber-300 font-bold truncate mt-1 flex items-center gap-1.5">
                              <span>💅 {notif.services || 'Nail Treatment'}</span>
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {notif.date && (
                                <span className="inline-flex items-center gap-1 bg-stone-900 text-stone-200 border border-stone-800 px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                                  📅 {new Date(notif.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {notif.phone && (
                                <span className="inline-flex items-center gap-1 bg-stone-900 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold">
                                  📞 {notif.phone}
                                </span>
                              )}
                              {notif.isGroup && (
                                <span className="bg-gradient-to-r from-amber-400 to-rose-400 text-stone-950 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">
                                  💍 Group
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="py-2.5 px-4 bg-stone-900/90 border-t border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[11px] text-stone-300 font-medium">
                        Live real-time sync active
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-400/80 font-semibold">
                      Click to inspect
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* View Client Site Shortcut */}
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 px-3 py-1.5 rounded-xl transition-all"
              title="Preview Customer Website in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Salon Site</span>
            </Link>

            {/* Security Settings */}
            <button
              type="button"
              onClick={() => {
                setShowSecurityModal(true);
                setSecurityError('');
                setSecuritySuccess('');
                setCurrentUsernameInput(username || 'admin');
                setCurrentPasswordInput('');
                setNewPasswordInput('');
                setConfirmPasswordInput('');
                setShowCurrentPass(false);
                setShowNewPass(false);
                setShowConfirmPass(false);
              }}
              className="text-xs bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Security & Password Settings"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Security</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => loadData(true)}
              className="text-xs bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh appointments"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-7">
        
        {/* Executive KPI Stats Bar (Clickable to Filter) */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
            
            {/* 1. Total Orders */}
            <div 
              onClick={() => setFilterStatus('all')}
              className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer shadow-2xs group ${
                filterStatus === 'all' 
                  ? 'bg-stone-950 text-white border-stone-950 ring-2 ring-stone-900/40' 
                  : 'bg-white hover:bg-stone-50 border-stone-200/90 text-stone-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${filterStatus === 'all' ? 'text-amber-300' : 'text-stone-500'}`}>
                  Total Bookings
                </span>
                <span className={`p-1.5 rounded-xl ${filterStatus === 'all' ? 'bg-white/10 text-amber-300' : 'bg-stone-100 text-stone-600'}`}>
                  <Calendar className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="font-serif text-2xl sm:text-3xl font-extrabold block">{stats.total_orders}</span>
              <span className={`text-[10px] mt-1 block font-medium ${filterStatus === 'all' ? 'text-stone-400' : 'text-stone-400'}`}>
                All recorded sessions
              </span>
            </div>

            {/* 2. Pending Action */}
            <div 
              onClick={() => setFilterStatus('pending')}
              className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer shadow-2xs ${
                filterStatus === 'pending'
                  ? 'bg-amber-400 text-stone-950 border-amber-400 ring-2 ring-amber-400/50'
                  : 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 hover:border-amber-400 border-amber-200/80 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Pending Review
                </span>
                <span className={`p-1.5 rounded-xl ${filterStatus === 'pending' ? 'bg-stone-950 text-amber-300' : 'bg-amber-200/80 text-amber-900'}`}>
                  <Clock className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="font-serif text-2xl sm:text-3xl font-extrabold block">{stats.pending_orders}</span>
              <span className={`text-[10px] mt-1 block font-medium ${filterStatus === 'pending' ? 'text-stone-900' : 'text-amber-700'}`}>
                {parseInt(stats.pending_orders, 10) > 0 ? '⚠️ Action Required' : 'All clear'}
              </span>
            </div>

            {/* 3. Confirmed Appointments */}
            <div 
              onClick={() => setFilterStatus('confirmed')}
              className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer shadow-2xs ${
                filterStatus === 'confirmed'
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/50'
                  : 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 hover:border-emerald-400 border-emerald-200/80 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Confirmed
                </span>
                <span className={`p-1.5 rounded-xl ${filterStatus === 'confirmed' ? 'bg-white/20 text-white' : 'bg-emerald-200/80 text-emerald-900'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="font-serif text-2xl sm:text-3xl font-extrabold block">{stats.confirmed_orders}</span>
              <span className={`text-[10px] mt-1 block font-medium ${filterStatus === 'confirmed' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                Ready for appointment
              </span>
            </div>

            {/* 4. VIP Group & Bridal */}
            <div 
              onClick={() => setFilterStatus(filterStatus === 'groups' ? 'all' : 'groups')}
              className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer shadow-2xs ${
                filterStatus === 'groups' 
                  ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-stone-950 border-amber-400 ring-2 ring-amber-400/50 font-black' 
                  : 'bg-gradient-to-br from-rose-50/80 via-white to-amber-50/50 hover:border-amber-400 border-rose-200/80 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  💍 Group / Bridal
                </span>
                <span className={`p-1.5 rounded-xl ${filterStatus === 'groups' ? 'bg-stone-950 text-amber-300' : 'bg-rose-200/80 text-rose-900'}`}>
                  <Users className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="font-serif text-2xl sm:text-3xl font-extrabold block">{stats.group_orders}</span>
              <span className={`text-[10px] mt-1 block font-medium ${filterStatus === 'groups' ? 'text-stone-900' : 'text-rose-700'}`}>
                Party bookings (3+ guests)
              </span>
            </div>

            {/* 5. Cancelled Sessions */}
            <div 
              onClick={() => setFilterStatus('cancelled')}
              className={`col-span-2 sm:col-span-1 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer shadow-2xs ${
                filterStatus === 'cancelled'
                  ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-500/50'
                  : 'bg-gradient-to-br from-rose-50/80 via-white to-rose-50/40 hover:border-rose-400 border-rose-200/80 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Cancelled
                </span>
                <span className={`p-1.5 rounded-xl ${filterStatus === 'cancelled' ? 'bg-white/20 text-white' : 'bg-rose-200/80 text-rose-900'}`}>
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="font-serif text-2xl sm:text-3xl font-extrabold block">{stats.cancelled_orders || orders.filter(o => o.status === 'cancelled').length}</span>
              <span className={`text-[10px] mt-1 block font-medium ${filterStatus === 'cancelled' ? 'text-rose-100' : 'text-rose-700'}`}>
                Cancelled sessions
              </span>
            </div>

          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-2xs space-y-3 sm:space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Live Search Input */}
            <div className="relative flex-1 w-full max-w-lg">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by client name, phone, address, or treatment..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 focus:outline-none transition-all placeholder:text-stone-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between md:justify-end gap-2.5 flex-wrap w-full md:w-auto">
              <span className="text-xs text-stone-500 font-semibold">
                Displaying <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
              </span>

              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDeleteAllModal(true)}
                  className="text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ml-auto sm:ml-0"
                  title="Delete all appointment records"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All</span>
                </button>
              )}
            </div>

          </div>

          {/* Filter Status Pills Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'groups', label: '💍 VIP Groups', count: stats?.group_orders || 0 },
              { id: 'pending', label: '⏳ Pending', count: stats?.pending_orders || 0 },
              { id: 'confirmed', label: '✅ Confirmed', count: stats?.confirmed_orders || 0 },
              { id: 'cancelled', label: '❌ Cancelled', count: stats?.cancelled_orders || orders.filter(o => o.status === 'cancelled').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? tab.id === 'groups'
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  filterStatus === tab.id
                    ? tab.id === 'groups' ? 'bg-stone-950 text-amber-300' : 'bg-white/20 text-white'
                    : 'bg-stone-200/80 text-stone-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

        </div>

        {/* Orders Roster Section */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-stone-200/90 shadow-2xs space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-serif text-xl font-bold text-stone-900">No Booking Orders Found</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                {searchQuery 
                  ? `No appointments match your search "${searchQuery}". Try a different name or number.`
                  : `There are currently no appointments under the "${filterStatus}" filter.`}
              </p>
            </div>
            {(searchQuery || filterStatus !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors cursor-pointer shadow-xs"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map(order => {
              const dateObj = new Date(order.appointment_date);
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const isGroup = order.is_wedding_or_group;
              const avatarLetter = (order.client_name || 'C').charAt(0).toUpperCase();

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-[2.2rem] border transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden ${
                    isGroup 
                      ? 'border-amber-300/90 ring-1 ring-amber-400/20' 
                      : 'border-stone-200/90 hover:border-amber-300'
                  }`}
                >
                  
                  {/* Top Type Ribbon Banner */}
                  {isGroup ? (
                    <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-stone-950 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs font-extrabold text-xs">
                      <span className="flex items-center gap-2 uppercase tracking-wider">
                        <Users className="w-4 h-4 text-stone-950 shrink-0" />
                        <span>VIP GROUP / BRIDAL APPOINTMENT SESSION ({order.group_size || 3} GUESTS)</span>
                      </span>
                      <span className="text-[10px] bg-stone-950 text-amber-300 px-3 py-0.5 rounded-full uppercase font-bold tracking-wider">
                        👑 Group Session Roster
                      </span>
                    </div>
                  ) : (
                    <div className="bg-stone-100/90 border-b border-stone-200/80 text-stone-600 px-6 py-2 flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-stone-500 font-bold">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span>Individual Client Appointment</span>
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                        1 Person
                      </span>
                    </div>
                  )}

                  {/* Card Content Body */}
                  <div className="p-4 sm:p-7 space-y-4 sm:space-y-5">
                    
                    {/* Client Identity & Direct Action Buttons */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-stone-100">
                      
                      {/* Left: Avatar & Names */}
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-serif text-xl sm:text-2xl font-bold shrink-0 shadow-sm ${
                          isGroup 
                            ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 border border-amber-400' 
                            : 'bg-stone-100 text-stone-800 border border-stone-200'
                        }`}>
                          {avatarLetter}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight truncate max-w-[220px] sm:max-w-none">
                              {order.client_name}
                            </h3>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                              #{String(order.id).padStart(3, '0')}
                            </span>
                            {order.inspo_image_url && (
                              <span className="bg-gradient-to-r from-amber-100 to-rose-100 text-amber-950 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>📸 Custom Inspo ({order.inspo_image_url.split(',').filter(Boolean).length})</span>
                              </span>
                            )}
                          </div>

                          {/* Date, Time & Address Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs text-stone-600 mt-2">
                            <span className="inline-flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-xl font-bold text-stone-800 text-[11px] sm:text-xs">
                              <Calendar className="w-3.5 h-3.5 text-brand-600" />
                              <span>{formattedDate}</span>
                            </span>

                            <span className="inline-flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-xl text-stone-600 font-medium text-[11px] sm:text-xs">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              <span>
                                {order.appointment_time && !order.appointment_time.toLowerCase().includes('flexible')
                                  ? order.appointment_time
                                  : 'Flexible Time'}
                              </span>
                            </span>

                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-950 border border-amber-200/90 px-2.5 py-1 rounded-xl font-semibold text-[11px] sm:text-xs">
                              <MapPin className="w-3.5 h-3.5 text-amber-700" />
                              <span>{order.client_address || 'Kombolcha'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Direct Contact Actions */}
                      <div className="flex items-center gap-2 w-full lg:w-auto self-stretch lg:self-center pt-2 lg:pt-0">
                        <a
                          href={getCleanTel(order.client_phone)}
                          onClick={() => {
                            if (navigator.clipboard && order.client_phone) {
                              navigator.clipboard.writeText(order.client_phone).catch(() => {});
                            }
                            showToast(`Calling ${order.client_name || 'Client'} (${order.client_phone} copied to clipboard!)`);
                          }}
                          className="flex-1 sm:flex-initial justify-center bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02] active:scale-98 min-w-0 cursor-pointer"
                          title={`Call ${order.client_name}: ${order.client_phone} (Navigates directly to Phone Call App on mobile)`}
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">Call: {order.client_phone}</span>
                        </a>

                        {(() => {
                          let cleanDigits = (order.client_phone || '').replace(/\D/g, '');
                          if (cleanDigits.startsWith('0')) cleanDigits = '251' + cleanDigits.substring(1);
                          if (!cleanDigits.startsWith('251') && cleanDigits.length === 9) cleanDigits = '251' + cleanDigits;

                          const greetingMsg = encodeURIComponent(
                            `Hi ${order.client_name || ''}! This is Beauty Abyssi regarding your nail booking #${order.id} for ${order.services_selected || 'Nail Treatment'}.`
                          );
                          const clientTgUrl = cleanDigits 
                            ? `https://t.me/+${cleanDigits}?text=${greetingMsg}` 
                            : (order.telegram_link || 'https://t.me/Bonkersss');

                          return (
                            <a
                              href={clientTgUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                if (navigator.clipboard && order.client_phone) {
                                  navigator.clipboard.writeText(order.client_phone).catch(() => {});
                                }
                                showToast(`Opening Telegram for ${order.client_name} (${order.client_phone} copied!)`);
                              }}
                              title={`Chat with ${order.client_name} on Telegram (+${cleanDigits})`}
                              className="flex-1 sm:flex-initial justify-center bg-[#229ED9] hover:bg-[#1e8ec3] active:bg-[#1b7ea7] text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shrink-0"
                            >
                              <Send className="w-3.5 h-3.5 shrink-0" />
                              <span>Telegram</span>
                            </a>
                          );
                        })()}
                      </div>

                    </div>

                    {/* Selected Treatments Showcase with High-Res Artwork Pictures */}
                    {(() => {
                      const selectedItems = (order.services_selected || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);

                      return (
                        <div className="bg-stone-50/80 p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase font-bold text-stone-600 tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              <span>Selected Treatment Art ({selectedItems.length})</span>
                            </span>
                            <span className="text-[10px] text-stone-400 font-medium">Click thumbnail to view large fullscreen</span>
                          </div>

                          {/* Grid of Compact Treatment Cards with Small Thumbnails */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {selectedItems.map((item, sIdx) => {
                              const matched = servicesList.find(s => 
                                s.name.trim().toLowerCase() === item.toLowerCase() ||
                                s.name.toLowerCase().includes(item.toLowerCase()) ||
                                item.toLowerCase().includes(s.name.toLowerCase())
                              );
                              const imgUrl = matched?.image_url;

                              return (
                                <div 
                                  key={sIdx}
                                  className="bg-white p-2.5 rounded-xl border border-stone-200/90 shadow-2xs flex items-center gap-3 hover:border-amber-400 transition-all group"
                                >
                                  {imgUrl ? (
                                    <div 
                                      className="relative rounded-xl overflow-hidden shrink-0 border border-amber-300/80 cursor-pointer shadow-xs bg-stone-100 group/thumb"
                                      style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px', maxWidth: '56px', maxHeight: '56px' }}
                                      onClick={() => {
                                        setZoomUrl(imgUrl);
                                        setZoomTitle(`${item} (${order.client_name})`);
                                        setZoomOpen(true);
                                      }}
                                      title="Click to zoom fullscreen"
                                    >
                                      <img 
                                        src={imgUrl} 
                                        alt={item}
                                        style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                                        className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200" 
                                      />
                                      <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <ZoomIn className="w-4 h-4 stroke-[2.5]" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div 
                                      className="rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0"
                                      style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
                                    >
                                      <Sparkles className="w-5 h-5" />
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 inline-block mb-0.5 border border-stone-200">
                                      {matched?.category || 'Treatment'}
                                    </span>
                                    <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 truncate">
                                      {item}
                                    </h4>
                                    <p className="text-[10px] text-amber-700 font-medium">
                                      🔍 Click thumbnail to enlarge
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Client Special Notes */}
                          {order.notes && (
                            <div className="bg-white p-2.5 rounded-xl border border-stone-200/90 text-xs text-stone-700 italic flex items-start gap-2">
                              <span className="font-bold text-stone-900 not-italic shrink-0">📝 Notes:</span>
                              <span>"{order.notes}"</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Group Members List if Group Booking */}
                    {order.group_members && (() => {
                      try {
                        const members = typeof order.group_members === 'string' ? JSON.parse(order.group_members) : order.group_members;
                        if (Array.isArray(members) && members.length > 0) {
                          return (
                            <div className="bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-4 sm:p-5 rounded-3xl border border-amber-300/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-amber-600" />
                                  <span>Group Guest List ({members.length} Members)</span>
                                </span>
                                <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                                  Discount Session
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {members.map((m, idx) => (
                                  <div key={idx} className="bg-white p-3.5 rounded-2xl border border-stone-200/90 space-y-2 shadow-2xs">
                                    <div className="font-bold text-xs text-stone-900 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                          idx === 0 ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 text-stone-700'
                                        }`}>
                                          {idx + 1}
                                        </span>
                                        <span className="truncate">{m.name || 'Unnamed'}</span>
                                      </span>
                                      {idx === 0 && (
                                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">
                                          Host
                                        </span>
                                      )}
                                    </div>

                                    {m.phone ? (
                                      <div className="text-[11px] text-stone-600 flex items-center justify-between gap-1 pt-0.5">
                                        <span className="flex items-center gap-1 font-medium truncate">
                                          <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                                          <span className="truncate">{m.phone}</span>
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <a
                                            href={getCleanTel(m.phone)}
                                            onClick={() => {
                                              if (navigator.clipboard && m.phone) navigator.clipboard.writeText(m.phone).catch(() => {});
                                              showToast(`Calling ${m.name || 'guest'} (${m.phone})`);
                                            }}
                                            className="text-[10px] bg-stone-100 hover:bg-stone-900 hover:text-white border border-stone-200 text-stone-700 px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                                            title={`Call ${m.name || 'guest'}: ${m.phone}`}
                                          >
                                            <Phone className="w-2.5 h-2.5 text-emerald-500" />
                                            <span>Call</span>
                                          </a>
                                          {(() => {
                                            let mDigits = (m.phone || '').replace(/\D/g, '');
                                            if (mDigits.startsWith('0')) mDigits = '251' + mDigits.substring(1);
                                            if (!mDigits.startsWith('251') && mDigits.length === 9) mDigits = '251' + mDigits;
                                            return mDigits ? (
                                              <a
                                                href={`https://t.me/+${mDigits}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => {
                                                  if (navigator.clipboard) navigator.clipboard.writeText(m.phone).catch(() => {});
                                                  showToast(`Opening Telegram for ${m.name || 'guest'} (${m.phone} copied!)`);
                                                }}
                                                className="text-[10px] bg-[#229ED9]/10 hover:bg-[#229ED9] text-[#229ED9] hover:text-white border border-[#229ED9]/30 px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-0.5"
                                                title={`Telegram ${m.name || 'guest'} (+${mDigits})`}
                                              >
                                                <Send className="w-2.5 h-2.5" />
                                                <span>TG</span>
                                              </a>
                                            ) : null;
                                          })()}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-stone-400 italic">No direct phone</div>
                                    )}

                                    {m.address && (
                                      <div className="text-[11px] text-stone-500 flex items-center gap-1 pt-0.5">
                                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                        <span className="truncate">{m.address}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        return null;
                      }
                      return null;
                    })()}

                    {/* Multi-Photo Custom Inspo Showcase */}
                    {order.inspo_image_url && (() => {
                      const photos = order.inspo_image_url.split(',').filter(Boolean);
                      if (photos.length === 0) return null;

                      return (
                        <div className="bg-gradient-to-br from-amber-50/70 via-white to-purple-50/40 border border-amber-300/80 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-[10px] shadow-xs">
                                ✨
                              </span>
                              <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900">
                                Client Inspo Reference ({photos.length} Photo{photos.length > 1 ? 's' : ''})
                              </h4>
                            </div>
                            <span className="text-[10px] text-stone-500 font-medium">
                              Click thumbnail to enlarge
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            {photos.map((url, pIdx) => (
                              <div
                                key={pIdx}
                                className="relative group cursor-pointer rounded-xl overflow-hidden border border-amber-400/90 shadow-2xs hover:shadow-md transition-all shrink-0 bg-stone-100"
                                style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px' }}
                                onClick={() => {
                                  setZoomUrl(url);
                                  setZoomTitle(`Client Inspo #${pIdx + 1} (${order.client_name})`);
                                  setZoomOpen(true);
                                }}
                                title="Click to view large fullscreen"
                              >
                                <img
                                  src={url}
                                  alt={`Inspo #${pIdx + 1}`}
                                  style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ZoomIn className="w-4 h-4 stroke-[2.5]" />
                                </div>
                                <div className="absolute bottom-1 right-1 bg-stone-900/85 text-white text-[8px] font-bold px-1 py-0.2 rounded">
                                  #{pIdx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Cancellation Reason Alert if Cancelled */}
                    {order.status === 'cancelled' && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-950 rounded-2xl p-3.5 text-xs flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-extrabold uppercase tracking-wide text-rose-800 text-[11px]">Cancellation Reason:</span>{' '}
                            <span className="font-medium italic text-rose-900">{order.cancellation_reason || 'Client requested cancellation'}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingOrderId(order.id);
                            setSelectedPresetReason('');
                            setCustomReasonDetails(order.cancellation_reason || '');
                            setShowCancelModal(true);
                          }}
                          className="text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 border border-rose-300 px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                          Edit Reason
                        </button>
                      </div>
                    )}

                    {/* Bottom Settlement & Workflow Control Bar */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-100 flex-wrap sm:flex-nowrap">
                      
                      {/* Status Dropdown: Pending, Confirmed, Cancelled */}
                      <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
                        <label className="text-xs font-bold text-stone-700 uppercase tracking-wider shrink-0">
                          Status:
                        </label>
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border focus:outline-none transition-all cursor-pointer shadow-2xs flex-1 sm:flex-initial ${
                            order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            order.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                            'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="pending">⏳ Pending Review</option>
                          <option value="confirmed">✅ Confirmed</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </div>

                      {/* Delete Appointment Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmOrder(order)}
                          title="Delete this appointment"
                          className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Inspo Image Zoom Modal */}
      <ImageModal
        isOpen={zoomOpen}
        onClose={() => setZoomOpen(false)}
        imageUrl={zoomUrl}
        title={zoomTitle}
      />

      {/* Security & Password Settings Modal - Bright Luxury Theme */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white border-2 border-stone-200 text-stone-900 rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Top Gold Trim */}
            <div className="h-2 w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200"></div>

            <div className="p-6 sm:p-8 pt-4 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                    <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">Artist Credentials</h3>
                    <p className="text-xs text-stone-500">Update username & portal password</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  className="text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error / Success Alerts */}
              {securityError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{securityError}</span>
                </div>
              )}
              {securitySuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{securitySuccess}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                    Current Username
                  </label>
                  <input
                    type="text"
                    required
                    value={currentUsernameInput}
                    onChange={(e) => setCurrentUsernameInput(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 text-stone-900 text-xs font-medium focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-4 pr-11 py-3 rounded-2xl bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 text-stone-900 text-xs font-medium focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition-colors"
                      tabIndex={-1}
                      aria-label={showCurrentPass ? 'Hide current password' : 'Show current password'}
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-4 pr-11 py-3 rounded-2xl bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 text-stone-900 text-xs font-medium focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition-colors"
                      tabIndex={-1}
                      aria-label={showNewPass ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-4 pr-11 py-3 rounded-2xl bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 text-stone-900 text-xs font-medium focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowSecurityModal(false)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors text-center cursor-pointer border border-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={securityLoading}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {securityLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    <span>{securityLoading ? 'Verifying...' : 'Update Credentials'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Cancellation Reason Modal - World-Class Luxury "W" UI */}
      {showCancelModal && (() => {
        const cancellingOrder = orders.find(o => o.id === cancellingOrderId);
        const presetReasons = [
          {
            icon: '💬',
            title: 'Client Requested',
            desc: 'Client requested reschedule or cancellation',
            value: 'Client requested cancellation'
          },
          {
            icon: '📵',
            title: 'No-Show / Unreachable',
            desc: 'Client did not respond or attend appointment',
            value: 'Client did not respond / No-show'
          },
          {
            icon: '🗓️',
            title: 'Schedule Conflict',
            desc: 'Salon fully booked or time slot overlap',
            value: 'Schedule conflict / Fully booked'
          },
          {
            icon: '🚨',
            title: 'Salon Emergency',
            desc: 'Materials unavailable or artist emergency',
            value: 'Salon emergency / Materials unavailable'
          }
        ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white border-2 border-stone-200 text-stone-900 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.18)] max-h-[92vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200">
              
              {/* Top Luxury Gradient Trim Accent */}
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 rounded-full"></div>

              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm shrink-0">
                    <AlertCircle className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        Cancellation Review
                      </span>
                      {cancellingOrderId && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-mono">
                          Order #{cancellingOrderId}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight mt-1">
                      Cancel Appointment
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingOrderId(null);
                    setSelectedPresetReason('');
                    setCustomReasonDetails('');
                  }}
                  className="text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Appointment Client Quick Preview Card */}
              {cancellingOrder && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="min-w-0">
                    <span className="font-serif font-bold text-stone-900 text-sm block truncate">
                      {cancellingOrder.client_name}
                    </span>
                    <span className="text-amber-800 font-medium text-[11px] truncate block mt-0.5">
                      💅 {cancellingOrder.services_selected || 'Nail Treatment'}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200 text-[10px] font-semibold text-stone-700 shadow-sm">
                      <Calendar className="w-3 h-3 text-amber-500" />
                      <span>{cancellingOrder.appointment_date}</span>
                    </span>
                    {cancellingOrder.client_phone && (
                      <span className="block text-[10px] font-mono text-stone-500 mt-1">
                        {cancellingOrder.client_phone}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Informational Guidance */}
              <p className="text-xs text-stone-600 leading-relaxed">
                Please specify the reason below. This explanation will be logged and visible to the client in their booking status portal.
              </p>

              {/* Quick Preset Reason Cards (2x2 Grid) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Select Preset Reason</span>
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">Click to select</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {presetReasons.map((preset, pIdx) => {
                    const isSelected = selectedPresetReason === preset.value;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setSelectedPresetReason(prev => prev === preset.value ? '' : preset.value)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 group relative ${
                          isSelected
                            ? 'bg-gradient-to-br from-amber-50 via-amber-100/90 to-rose-50 text-stone-950 border-2 border-amber-400 shadow-sm ring-1 ring-amber-400/40'
                            : 'bg-white hover:bg-stone-50 hover:border-stone-300 border-stone-200 text-stone-700 shadow-sm'
                        }`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{preset.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-bold truncate block ${isSelected ? 'text-stone-950 font-extrabold' : 'text-stone-900'}`}>
                              {preset.title}
                            </span>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] block mt-0.5 line-clamp-1 ${isSelected ? 'text-stone-800 font-medium' : 'text-stone-500'}`}>
                            {preset.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Reason Textarea */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700">
                  Or Customize Specific Details:
                </label>
                <textarea
                  rows={3}
                  value={customReasonDetails}
                  onChange={(e) => setCustomReasonDetails(e.target.value)}
                  placeholder="e.g. Rescheduled with client to next Tuesday afternoon due to salon inventory restock."
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 text-stone-900 text-xs font-medium placeholder:text-stone-400 focus:ring-2 focus:ring-amber-200 focus:border-amber-400 focus:outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingOrderId(null);
                    setSelectedPresetReason('');
                    setCustomReasonDetails('');
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-bold transition-all text-center cursor-pointer shadow-sm active:scale-98"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  disabled={cancelSubmitting}
                  onClick={handleConfirmCancellation}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-98 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {cancelSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{cancelSubmitting ? 'Cancelling...' : 'Confirm Cancel'}</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border-2 border-stone-200 text-stone-900 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 text-center max-h-[90vh] overflow-y-auto">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shrink-0 shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Are you sure you want to delete this appointment?
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Order <strong className="text-amber-800 font-mono">#{deleteConfirmOrder.id}</strong> for <strong className="text-stone-900">{deleteConfirmOrder.client_name}</strong> on <strong className="text-stone-900">{new Date(deleteConfirmOrder.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong> will be permanently removed from your dashboard.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrder(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer border border-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Yes, Delete</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete All Appointments Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border-2 border-stone-200 text-stone-900 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 text-center max-h-[90vh] overflow-y-auto">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shrink-0 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Delete ALL Appointments?
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Are you sure you want to delete <strong className="text-stone-900">ALL {orders.length} appointment records</strong>? This will permanently wipe your entire booking roster. This action <strong className="text-rose-600 font-semibold">cannot be undone</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer border border-stone-200"
              >
                Keep All
              </button>
              <button
                type="button"
                disabled={deleteAllLoading}
                onClick={handleDeleteAllAppointments}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteAllLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Yes, Delete Everything</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-700 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}
