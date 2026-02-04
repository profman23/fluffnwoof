/**
 * Portal Layout
 * Main layout wrapper for authenticated portal pages
 */

import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PortalThemeProvider } from '../../../context/PortalThemeContext';
import { BookingSocketProvider } from '../../../context/BookingSocketContext';
import { ToastProvider } from '../ui/Toast';
import { TopHeader } from './TopHeader';
import { BottomNavigation } from './BottomNavigation';
import { useCustomerAuthStore } from '../../../store/customerAuthStore';
import { LogoLoader } from '../../common/LogoLoader';
import { pageFade } from '../../../styles/portal/animations';

// Import brand pattern styles
import '../../../styles/brandPattern.css';

// ============================================
// PORTAL LAYOUT (For authenticated pages)
// ============================================

export const PortalLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useCustomerAuthStore();
  const { i18n } = useTranslation();
  const location = useLocation();

  // Initialize language from portal-language localStorage (default to Arabic)
  useEffect(() => {
    const portalLang = localStorage.getItem('portal-language');
    if (portalLang && ['ar', 'en'].includes(portalLang)) {
      i18n.changeLanguage(portalLang);
      document.documentElement.dir = portalLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = portalLang;
    } else {
      // Default to Arabic for portal
      i18n.changeLanguage('ar');
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
      localStorage.setItem('portal-language', 'ar');
    }
  }, [i18n]);

  // Show loading state with LogoLoader
  if (isLoading) {
    return (
      <PortalThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <LogoLoader animation="pulse" />
        </div>
      </PortalThemeProvider>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  return (
    <PortalThemeProvider>
      <BookingSocketProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 brand-pattern-bg">
            {/* Header */}
            <TopHeader />

            {/* Main Content */}
            <main className="pb-20 min-h-[calc(100vh-3.5rem)] relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  variants={pageFade}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="px-4 py-4"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation />
          </div>
        </ToastProvider>
      </BookingSocketProvider>
    </PortalThemeProvider>
  );
};

// ============================================
// PUBLIC PORTAL LAYOUT (For login/register pages)
// ============================================

export const PublicPortalLayout: React.FC = () => {
  const { i18n } = useTranslation();
  const location = useLocation();

  // Initialize language from portal-language localStorage (default to Arabic)
  useEffect(() => {
    const portalLang = localStorage.getItem('portal-language');
    if (portalLang && ['ar', 'en'].includes(portalLang)) {
      i18n.changeLanguage(portalLang);
      document.documentElement.dir = portalLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = portalLang;
    } else {
      // Default to Arabic for portal
      i18n.changeLanguage('ar');
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
      localStorage.setItem('portal-language', 'ar');
    }
  }, [i18n]);

  return (
    <PortalThemeProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 brand-pattern-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageFade}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </ToastProvider>
    </PortalThemeProvider>
  );
};

export default PortalLayout;
