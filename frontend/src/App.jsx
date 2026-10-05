import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Help from './pages/Help';
import MaintenancePage from './pages/MaintenancePage';
import useMaintenanceMode from './hooks/useMaintenanceMode';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export default function App() {
  const { isMaintenance, checkStatus } = useMaintenanceMode();
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      document.title = "Beauty Abyssi Nail";
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/png';
      link.href = '/favicon.png';
    }
  }, [location.pathname]);

  if (isMaintenance) {
    return (
      <>
        <ScrollToTop />
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<MaintenancePage onRefresh={checkStatus} />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Home defaultCategory="all" />} />
        <Route path="/hand" element={<Home defaultCategory="Hand" />} />
        <Route path="/pedicure" element={<Home defaultCategory="Leg" />} />
        <Route path="/inspo" element={<Home defaultSection="inspo" />} />
        <Route path="/help" element={<Help />} />
        <Route path="/my-bookings" element={<Help defaultTab="history" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
