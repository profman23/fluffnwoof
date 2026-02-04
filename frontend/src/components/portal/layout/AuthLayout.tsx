/**
 * Portal Auth Layout
 * Layout for login, register, forgot password pages
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import { fadeInUp } from '../../../styles/portal/animations';

// ============================================
// ICONS
// ============================================

const SunIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const GlobeIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

// ============================================
// TYPES
// ============================================

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  titleIcon?: React.ReactNode;
  subtitle?: string;
  showBackToLogin?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  titleIcon,
  subtitle,
  showBackToLogin = false,
}) => {
  const { t, i18n } = useTranslation('portal');
  const { isDark, toggleTheme } = usePortalTheme();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('portal-language', newLang);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-mint-100 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between safe-area-top">
        {/* Back to Login */}
        {showBackToLogin ? (
          <Link
            to="/portal/login"
            className="text-sm text-mint-600 dark:text-mint-400 hover:underline"
          >
            {t('forgotPassword.backToLogin')}
          </Link>
        ) : (
          <div />
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Language Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleLanguage}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <GlobeIcon />
            <span className="text-xs font-medium">
              {i18n.language === 'ar' ? 'EN' : 'عربي'}
            </span>
          </motion.button>

          {/* Theme Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </motion.button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col px-6 py-8">
        {/* Logo & Title */}
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ ...fadeInUp.transition, delay: 0 }}
          className="text-center mb-8"
        >
          {/* Logo */}
          <Link to="/portal" className="inline-block mb-6">
            <img
              src="/logo.png"
              alt="Fluff N' Woof"
              className="w-24 h-24 mx-auto object-contain drop-shadow-lg"
            />
          </Link>

          {/* Title or Icon */}
          {titleIcon ? (
            <div className="mb-2">{titleIcon}</div>
          ) : title ? (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>
          ) : null}

          {/* Subtitle */}
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Form Content */}
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ ...fadeInUp.transition, delay: 0.1 }}
          className="flex-1"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center safe-area-bottom">
        <p className="text-xs text-gray-400 dark:text-gray-600">
          Fluff N' Woof © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default AuthLayout;
