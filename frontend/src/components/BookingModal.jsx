import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { X, Calendar, Clock, Check, Upload, Send, Phone, Sparkles, AlertCircle, Heart, User, MapPin, Image as ImageIcon, Users, Plus, Trash2 } from 'lucide-react';

export default function BookingModal({ isOpen, onClose, services = [], preselectedService = null, isGroupInitial = false }) {
  // Always default selected treatments to empty (null/empty array)
  const [selectedServices, setSelectedServices] = useState([]);
  const [activeTab, setActiveTab] = useState('Hand'); // 'Hand', 'Leg', or 'Inspo'
  
  // Single Client state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [isWeddingGroup, setIsWeddingGroup] = useState(isGroupInitial);
  const [notes, setNotes] = useState('');

  // Group Booking state (Minimum 3, up to 15)
  const [groupSize, setGroupSize] = useState(3);
  const [groupMembers, setGroupMembers] = useState([
    { name: '', phone: '', address: '' },
    { name: '', phone: '', address: '' },
    { name: '', phone: '', address: '' },
  ]);

  // Multiple Inspo images support: up to groupSize (or 1 for individual)
  const [inspoList, setInspoList] = useState([]); // array of { file, preview, name }

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const gridScrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessData(null);
      setIsWeddingGroup(isGroupInitial);
      if (preselectedService) {
        if (preselectedService.toLowerCase().includes('inspo') || preselectedService.toLowerCase().includes('custom')) {
          setActiveTab('Inspo');
          setSelectedServices(['Custom Inspo Nail Art']);
        } else {
          setSelectedServices([preselectedService]);
          const matched = services.find(s => s.name.toLowerCase() === preselectedService.toLowerCase());
          if (matched) {
            setActiveTab(matched.category);
          } else {
            setActiveTab('Hand');
          }
        }
      } else {
        // ALWAYS default to empty selection (no service selected by default)
        setActiveTab('Hand');
        setSelectedServices([]);
      }
    }
  }, [isOpen, preselectedService, isGroupInitial, services]);

  // Handle party size dropdown change (3 to 15)
  const handleGroupSizeChange = (newVal) => {
    const size = parseInt(newVal, 10) || 3;
    setGroupSize(size);
    setGroupMembers(prev => {
      const next = [...prev];
      if (next.length < size) {
        while (next.length < size) {
          next.push({ name: '', phone: '', address: '' });
        }
      } else if (next.length > size) {
        return next.slice(0, size);
      }
      return next;
    });
  };

  const updateMember = (index, field, value) => {
    setGroupMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (index === 0) {
      if (field === 'name') setClientName(value);
      if (field === 'phone') setClientPhone(value);
      if (field === 'address') setClientAddress(value);
    }
  };

  const copyHostAddressToAll = () => {
    const leadAddr = groupMembers[0]?.address || clientAddress || '';
    if (!leadAddr.trim()) {
      setErrorMsg('Please enter Guest 1 (Lead Host) address first before copying.');
      return;
    }
    setErrorMsg('');
    setGroupMembers(prev => prev.map(m => ({ ...m, address: leadAddr })));
  };

  const toggleService = (name) => {
    if (selectedServices.includes(name)) {
      setSelectedServices(selectedServices.filter(s => s !== name));
    } else {
      setSelectedServices([name, ...selectedServices]);
      // Always scroll the services grid to the top so selected services are immediately in front
      setTimeout(() => {
        if (gridScrollRef.current) {
          gridScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // When switching to the 'Inspo' tab, automatically select 'Custom Inspo Nail Art'
    if (tab === 'Inspo') {
      if (!selectedServices.includes('Custom Inspo Nail Art')) {
        setSelectedServices(['Custom Inspo Nail Art', ...selectedServices]);
      }
    }
    setTimeout(() => {
      if (gridScrollRef.current) {
        gridScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInspoList(prev => [...prev, { file, preview: event.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeInspoAt = (idx) => {
    setInspoList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedServices.length === 0) {
      setErrorMsg('Please select at least one treatment below.');
      return;
    }

    if (!appointmentDate) {
      setErrorMsg('Please select your preferred appointment date.');
      return;
    }

    let finalLeadName = clientName.trim();
    let finalLeadPhone = clientPhone.trim();
    let finalLeadAddress = clientAddress.trim();

    if (isWeddingGroup) {
      if (groupSize < 3) {
        setErrorMsg('Group discount requires a minimum of 3 people.');
        return;
      }
      
      // Strict validation: every guest must have both a full name and phone number (not optional)
      for (let i = 0; i < groupSize; i++) {
        const guestNum = i + 1;
        const tag = i === 0 ? ' (Lead Host)' : '';
        if (!groupMembers[i]?.name?.trim()) {
          setErrorMsg(`Please enter the Full Name for Guest ${guestNum}${tag}.`);
          return;
        }
        if (!groupMembers[i]?.phone?.trim()) {
          setErrorMsg(`Please enter the Phone Number for Guest ${guestNum}${tag}. Phone number is required for all guests.`);
          return;
        }
      }

      const host = groupMembers[0];
      if (!host?.address?.trim()) {
        setErrorMsg('Please specify the location/address for the group session.');
        return;
      }

      finalLeadName = host.name.trim();
      finalLeadPhone = host.phone.trim();
      finalLeadAddress = host.address.trim();
    } else {
      if (!clientName.trim() || !clientPhone.trim()) {
        setErrorMsg('Please enter your full name and phone number.');
        return;
      }
      if (!clientAddress.trim()) {
        setErrorMsg('Please specify your location or address (e.g. Kombolcha, Shisha Ber or Dessie).');
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('client_name', finalLeadName);
      formData.append('client_phone', finalLeadPhone);
      formData.append('client_address', finalLeadAddress);
      formData.append('appointment_date', appointmentDate);
      formData.append('appointment_time', 'Flexible / Coordinated on Telegram');
      formData.append('services_selected', selectedServices.join(', '));
      formData.append('is_wedding_or_group', isWeddingGroup);
      formData.append('group_size', isWeddingGroup ? groupSize : 1);
      if (isWeddingGroup) {
        formData.append('group_members', JSON.stringify(groupMembers.slice(0, groupSize)));
      }
      formData.append('notes', notes);

      inspoList.forEach(item => {
        formData.append('inspo_images', item.file);
      });

      const res = await axios.post('/api/registrations', formData);
      if (res.data.success) {
        setSuccessData(res.data);
        try {
          localStorage.setItem('abyssi_client_phone', finalLeadPhone);
          localStorage.setItem('abyssi_client_name', finalLeadName);
          localStorage.setItem('abyssi_client_address', finalLeadAddress);
        } catch (e) {
          console.warn('Could not save to localStorage', e);
        }
      } else {
        setErrorMsg(res.data.message || 'Error submitting booking');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error creating registration.');
    } finally {
      setLoading(false);
    }
  };

  const handServices = useMemo(() => services.filter(s => s.category === 'Hand'), [services]);
  const legServices = useMemo(() => services.filter(s => s.category === 'Leg'), [services]);

  // Current tab services sorted so that selected services are ALWAYS at the top!
  const sortedTabServices = useMemo(() => {
    const list = activeTab === 'Hand' ? handServices : legServices;
    return [...list].sort((a, b) => {
      const aSel = selectedServices.includes(a.name);
      const bSel = selectedServices.includes(b.name);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return (a.id || 0) - (b.id || 0);
    });
  }, [activeTab, handServices, legServices, selectedServices]);

  const isCustomInspo = activeTab === 'Inspo' || selectedServices.includes('Custom Inspo Nail Art');
  const isInspoSelected = selectedServices.includes('Custom Inspo Nail Art');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-t-[3rem] rounded-b-[2.5rem] shadow-2xl border-2 border-stone-200/90 overflow-hidden my-6 transition-all"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Top Gold Trim Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200"></div>

        {/* Header */}
        <div className="bg-stone-950 text-white px-7 py-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-stone-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3 h-3" />
            <span>Online Registration</span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            Reserve Your Nail Art Session
          </h3>
          <p className="text-xs text-stone-300 mt-1">
            Choose your desired treatments, select date & time, or attach custom inspiration.
          </p>
        </div>

        {/* ========================================= */}
        {/* SUCCESS VIEW (Direct Telegram Action)     */}
        {/* ========================================= */}
        {successData ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-18 h-18 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto shadow-inner">
              <Check className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold block mb-1">
                Booking Recorded
              </span>
              <h4 className="font-serif text-3xl font-bold text-stone-900">
                You're Officially Registered!
              </h4>
              <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{clientName || groupMembers[0]?.name}</strong>! Your appointment request for <strong>{appointmentDate}</strong> is saved in our system.
              </p>
            </div>

            {/* Automatic Notification Confirmation Card */}
            <div className="bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/50 border-2 border-emerald-300/80 p-6 rounded-3xl text-left shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Check className="w-4 h-4" />
                </span>
                <div>
                  <h5 className="font-bold text-xs text-stone-900 uppercase tracking-wide">
                    Delivered Directly to the Artist
                  </h5>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    ✓ Dispatched to Admin Portal & Telegram Alert
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Your appointment request and inspiration details have been sent to our artist. We will review your request and contact you directly via phone or Telegram to coordinate your exact session!
              </p>

              <a
                href={successData.telegramNotificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#229ED9] hover:bg-[#1a8dc3] text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Direct Chat with @Bonkersss on Telegram (Optional)</span>
              </a>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-stone-500">
              <Phone className="w-4 h-4 text-brand-600" />
              <span>Direct call: <a href="tel:+251956645851" className="font-bold text-stone-900 underline">+251 95 664 5851</a></span>
            </div>

            <button
              onClick={onClose}
              className="bg-stone-900 hover:bg-brand-700 text-white font-bold px-7 py-3 rounded-full text-xs transition-colors cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        ) : (
          /* ========================================= */
          /* THE NEW ULTRA-ATTRACTIVE BOOKING FORM     */
          /* ========================================= */
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* 1. Bridal & Group VIP Discount Toggle + Dropdown */}
            <div className="space-y-3">
              <div 
                onClick={() => setIsWeddingGroup(!isWeddingGroup)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border-2 flex items-center justify-between gap-4 ${
                  isWeddingGroup 
                    ? 'bg-gradient-to-r from-amber-50 to-rose-50 border-amber-400 shadow-sm'
                    : 'bg-stone-50 border-stone-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    isWeddingGroup ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-white text-stone-400 border border-stone-200'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block flex items-center gap-1.5">
                      <span>Wedding / Bridal / Group Discount (3+ Guests)</span>
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      Toggle on for our exclusive group discount rate! Minimum 3 people required (3 to 15 guests).
                    </span>
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <div className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 shrink-0 ${
                  isWeddingGroup ? 'bg-amber-400' : 'bg-stone-300'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                    isWeddingGroup ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              {/* Group Size Dropdown (Visible when Group Toggle is ON) */}
              {isWeddingGroup && (
                <div className="bg-gradient-to-br from-amber-50/90 via-white to-amber-50/60 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 space-y-3 animate-in fade-in duration-200 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span>How many people are in your group? *</span>
                      </label>
                      <span className="text-[11px] text-stone-500 mt-0.5 block">
                        Minimum 3 guests required for the group discount rate.
                      </span>
                    </div>

                    <select
                      value={groupSize}
                      onChange={(e) => handleGroupSizeChange(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-white border-2 border-amber-400 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-300 focus:outline-none shadow-2xs cursor-pointer"
                    >
                      {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num => (
                        <option key={num} value={num}>
                          {num} People {num === 3 ? '(Group Discount Minimum)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Interactive Nail Treatment Selection Grid */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Select Treatments *
                  </label>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {selectedServices.length === 0 ? (
                      <span className="text-amber-600 font-semibold">Please select at least 1 service below</span>
                    ) : (
                      <span className="text-brand-600 font-semibold">
                        {selectedServices.length} selected (pinned at top)
                      </span>
                    )}
                  </span>
                </div>

                {/* Subcategory switcher */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleTabChange('Hand')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'Hand' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Hand
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('Leg')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'Leg' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Pedicure
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('Inspo')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === 'Inspo' ? 'bg-amber-400 text-stone-950 shadow-2xs font-extrabold' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Custom Inspo</span>
                  </button>
                </div>
              </div>

              {/* Active Selected Services Preview Chips Bar (Visible when services are selected) */}
              {selectedServices.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50/90 to-rose-50/70 border border-amber-300/80 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Your Selected Treatments ({selectedServices.length}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedServices([])}
                      className="text-[10px] font-bold text-stone-500 hover:text-rose-600 transition-colors underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedServices.map(name => {
                      const sMatch = services.find(s => s.name === name);
                      const isLeg = sMatch?.category === 'Leg';
                      const isInspo = name.toLowerCase().includes('inspo');
                      return (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 bg-white border-2 border-brand-500 text-stone-900 px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs transition-all hover:scale-[1.02]"
                        >
                          <span className="text-[10px] uppercase font-bold text-stone-400">
                            {isInspo ? 'Inspo' : isLeg ? 'Pedicure' : 'Hand'}
                          </span>
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleService(name);
                            }}
                            className="text-stone-400 hover:text-white hover:bg-rose-500 rounded-full p-0.5 transition-colors ml-0.5 cursor-pointer"
                            title={`Remove ${name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inspo Tab View */}
              {activeTab === 'Inspo' ? (
                <div 
                  onClick={() => toggleService('Custom Inspo Nail Art')}
                  className={`p-4 sm:p-5 rounded-2xl flex items-start gap-4 transition-all cursor-pointer border-2 ${
                    isInspoSelected 
                      ? 'bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border-amber-400 shadow-md ring-2 ring-amber-400/20' 
                      : 'bg-white border-stone-200 hover:border-amber-300 shadow-xs'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-xs transition-colors ${
                    isInspoSelected ? 'bg-amber-400 text-stone-950' : 'bg-stone-100 text-stone-400'
                  }`}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-serif font-bold text-sm sm:text-base ${
                        isInspoSelected ? 'text-stone-950' : 'text-stone-800'
                      }`}>
                        Bespoke Custom Nail Art
                      </h4>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isInspoSelected ? 'bg-amber-200 text-amber-950' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {isInspoSelected ? 'Selected' : 'Click to select'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Bring any nail art picture from Pinterest, Instagram, or TikTok! Upload your dream inspiration photo below so we can prepare your exact polishes, charms, gems, and shapes in advance.
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-xs transition-colors ${
                    isInspoSelected ? 'bg-amber-500 text-white' : 'border border-stone-300'
                  }`}>
                    {isInspoSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                  </div>
                </div>
              ) : (
                /* Cards Grid for Hand / Leg Services - Selected Cards ALWAYS at the top! */
                <div 
                  ref={gridScrollRef}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1 scroll-smooth border border-stone-100 rounded-2xl"
                >
                  {sortedTabServices.map(s => {
                    const isSelected = selectedServices.includes(s.name);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.name)}
                        className={`text-left p-3 rounded-2xl border-2 transition-all flex flex-col justify-between h-24 relative overflow-hidden group cursor-pointer ${
                          isSelected 
                            ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-400/30 shadow-xs' 
                            : 'border-stone-200 bg-white hover:border-brand-300'
                        }`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-brand-700 font-extrabold' : 'text-stone-400'}`}>
                            {s.category}
                          </span>
                          {isSelected ? (
                            <div className="flex items-center gap-1 bg-brand-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full shadow-2xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              <span>Selected</span>
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-stone-300 group-hover:border-stone-400 transition-colors" />
                          )}
                        </div>

                        <span className={`font-serif font-bold text-xs leading-tight ${isSelected ? 'text-brand-950 font-extrabold' : 'text-stone-900'}`}>
                          {s.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Appointment Date & Client Details */}
            <div className="space-y-4">
              
              {/* If Group Booking: Dedicated Highlighted Session Date Box */}
              {isWeddingGroup && (
                <div className="bg-gradient-to-r from-amber-100/60 via-amber-50 to-amber-100/40 border-2 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-xs shrink-0">
                        <Calendar className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-extrabold text-stone-950 uppercase tracking-wider block font-serif">
                          Group Session Appointment Date *
                        </label>
                        <span className="text-[11px] text-stone-600 font-medium block">
                          Unified appointment date for all group members (all attend together)
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold text-amber-950 bg-amber-200/90 border border-amber-400/80 px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto shrink-0 shadow-2xs">
                      {appointmentDate ? `✓ ${appointmentDate}` : 'Pick Date *'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="date"
                      required
                      min={today}
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-2xl border-2 text-stone-950 font-bold text-sm shadow-xs transition-all cursor-pointer ${
                        appointmentDate 
                          ? 'border-amber-500 bg-white ring-2 ring-amber-400/30' 
                          : 'border-amber-400 bg-white hover:border-amber-500'
                      } focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-200`}
                    />
                  </div>
                </div>
              )}

              {/* A. If Standard Individual Booking (2x2 Grid - all 4 fields perfectly straight and identical height) */}
              {!isWeddingGroup && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Row 1, Col 1: Full Name */}
                  <div className="flex flex-col">
                    <label className="h-5 text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>Full Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="e.g. Sara Bekele"
                      className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs font-medium focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Row 1, Col 2: Phone Number */}
                  <div className="flex flex-col">
                    <label className="h-5 text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>Phone Number *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      placeholder="e.g. 0911234567"
                      className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs font-medium focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Row 2, Col 1: Location / Address */}
                  <div className="flex flex-col">
                    <label className="h-5 text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>Location / Address *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clientAddress}
                      onChange={e => setClientAddress(e.target.value)}
                      placeholder="e.g. Kombolcha, Shisha Ber or Dessie"
                      className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs font-medium focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Row 2, Col 2: Preferred Date (Under Phone Number, Beside Location / Address) */}
                  <div className="flex flex-col">
                    <label className="h-5 text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>Preferred Date *</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                      className="w-full h-11 px-4 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs font-medium focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* B. If Group Booking: Dynamic Input Sections for All Members */}
              {isWeddingGroup && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-stone-800">
                        Group Guest List ({groupSize} People)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={copyHostAddressToAll}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
                      title="Quickly fill all guest locations with Host address"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-700" />
                      <span>Copy Host Location to All</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {groupMembers.slice(0, groupSize).map((member, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                          idx === 0 
                            ? 'bg-amber-50/40 border-amber-300 shadow-2xs' 
                            : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900 flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                              idx === 0 ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 text-stone-700'
                            }`}>
                              {idx + 1}
                            </span>
                            <span>{idx === 0 ? 'Guest 1 (Lead Organizer / Host)' : `Guest ${idx + 1}`}</span>
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full uppercase">
                              Primary Contact
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={member.name || ''}
                              onChange={e => updateMember(idx, 'name', e.target.value)}
                              placeholder={idx === 0 ? 'e.g. Sara Bekele' : `Guest ${idx + 1} Full Name`}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-brand-600" />
                              <span>Phone Number *</span>
                            </label>
                            <input
                              type="tel"
                              required
                              value={member.phone || ''}
                              onChange={e => updateMember(idx, 'phone', e.target.value)}
                              placeholder="e.g. 0911234567"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none transition-all"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-brand-600" />
                              <span>{idx === 0 ? 'Location / Village / Address *' : `Guest ${idx + 1} Village / Address`}</span>
                            </label>
                            <input
                              type="text"
                              required={idx === 0}
                              value={member.address || ''}
                              onChange={e => updateMember(idx, 'address', e.target.value)}
                              placeholder={
                                idx === 0 
                                  ? 'e.g. Kombolcha, Kocha, Metateha or Dessie' 
                                  : `e.g. Village or address for Guest ${idx + 1}`
                              }
                              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none transition-all placeholder:text-stone-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Service Area Info Callout */}
            <div className="text-[11px] text-stone-600 flex items-start gap-2 bg-gradient-to-r from-amber-50/90 via-stone-50 to-amber-50/50 p-3 rounded-2xl border border-amber-200/80">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>📍 Service Area:</strong> Our artist serves <strong>Kombolcha city, nearby cities (e.g. Dessie)</strong>, and all surrounding villages (e.g. Shisha Ber). Please specify your city and village/neighborhood above!
              </div>
            </div>

            {/* 4. Inspo Photo Upload - Unlimited Photos Supported */}
            {isCustomInspo && (
              <div className="space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                    <span>
                      Attach Inspo Photos (Unlimited - Upload Any Amount)
                    </span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {inspoList.length} Photo{inspoList.length === 1 ? '' : 's'} Attached
                  </span>
                </div>

                {/* Photos Grid when files uploaded */}
                {inspoList.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {inspoList.map((item, i) => (
                      <div key={i} className="relative group bg-amber-50/70 border-2 border-amber-300 rounded-2xl overflow-hidden p-1 shadow-xs">
                        <img
                          src={item.preview}
                          alt={`Inspo reference ${i + 1}`}
                          className="w-full h-24 object-cover rounded-xl"
                        />
                        <div className="p-1 text-center">
                          <span className="text-[10px] font-bold text-stone-700 block truncate">
                            {isWeddingGroup && i < groupSize ? `Guest ${i + 1} Inspo` : `Inspo #${i + 1}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeInspoAt(i)}
                          className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-md transition-all cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Always visible Add More button */}
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50/60 rounded-2xl cursor-pointer transition-all p-2 text-center">
                      <Plus className="w-5 h-5 text-amber-600 mb-1" />
                      <span className="text-[11px] font-bold text-stone-700">Add More Photos</span>
                      <span className="text-[9px] text-stone-400">Unlimited (PNG, JPG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFilesChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Empty State / Upload trigger */}
                {inspoList.length === 0 && (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-50/60 rounded-2xl cursor-pointer transition-all">
                    <Upload className="w-5 h-5 text-amber-600 mb-1" />
                    <span className="text-xs font-bold text-stone-800">
                      Click to browse or snap your inspo photos (Unlimited)
                    </span>
                    <span className="text-[10px] text-stone-500 mt-0.5">
                      Upload as many nail art references as you want! PNG, JPG, or WEBP up to 5MB each.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFilesChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* 5. Special Notes */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Special Notes / Nail Shape / Desired Colors
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Sculpted almond shape, nude chrome finish, or group theme"
                className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs font-medium focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none transition-all"
              ></textarea>
            </div>

            {/* Pricing Footnote */}
            <div className="text-[11px] text-stone-500 italic bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
              💎 <strong>Friendly Pricing:</strong> Every artwork is tailored to your desire. Pricing is flexible and agreed upon direct consultation with the artist.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 transform active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Submitting Registration...' : 'Confirm & Register Online'}</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
