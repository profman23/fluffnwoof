/**
 * Customer Profile Page
 * Displays customer profile information with options to edit and logout
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCustomerAuthStore } from '../../store/customerAuthStore';
import { Card } from '../../components/portal/ui/Card';
import { Button } from '../../components/portal/ui/Button';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { staggerContainer, fadeInUpSimple } from '../../styles/portal/animations';

// ============================================
// ICONS
// ============================================

const LanguageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
  </svg>
);

const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

// ============================================
// SETTINGS ITEM COMPONENT
// ============================================

interface SettingsItemProps {
  icon: React.ReactNode;
  emoji?: string;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, emoji, label, value, onClick, danger }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-4 rounded-2xl transition-colors
        ${danger
          ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
          : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center
        ${danger
          ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
          : 'bg-mint-100 dark:bg-mint-900/40 text-mint-600 dark:text-mint-400'
        }
      `}>
        {emoji ? <span className="text-xl">{emoji}</span> : icon}
      </div>
      <div className="flex-1 text-start">
        <span className={`font-medium ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
          {label}
        </span>
        {value && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{value}</p>
        )}
      </div>
      <ChevronRightIcon className={`w-5 h-5 text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
    </motion.button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CustomerProfile: React.FC = () => {
  const { t, i18n } = useTranslation('portal');
  const navigate = useNavigate();
  const { customer, logout } = useCustomerAuthStore();
  const { isDark, toggleTheme } = usePortalTheme();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('portal-language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 pb-4"
    >
      {/* Profile Header */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={fadeInUpSimple.transition}
      >
        <Card
          variant="glass"
          className="bg-gradient-to-br from-mint-300 to-mint-400 dark:from-mint-400 dark:to-mint-500 text-gray-800 dark:text-gray-900 overflow-hidden relative"
        >
          {/* Decorative Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -bottom-10 -start-10 w-32 h-32 rounded-full bg-white" />
          </div>

          <div className="relative flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/30 flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {customer?.firstName} {customer?.lastName}
              </h1>
              <p className="text-mint-700 dark:text-mint-800 text-sm mt-1">
                <span dir="ltr" className="western-numerals inline-block">{customer?.email}</span>
              </p>
              <p className="text-mint-700 dark:text-mint-800 text-sm">
                <span dir="ltr" className="western-numerals inline-block">{customer?.phone}</span>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Settings Section */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>⚙️</span>
          {t('profile.settings')}
        </h2>

        <div className="space-y-3">
          {/* Language Toggle */}
          <SettingsItem
            emoji="🌐"
            icon={<LanguageIcon className="w-5 h-5" />}
            label={t('profile.language')}
            value={i18n.language === 'ar' ? 'العربية' : 'English'}
            onClick={handleLanguageToggle}
          />

          {/* Theme Toggle */}
          <SettingsItem
            emoji={isDark ? '🌙' : '☀️'}
            icon={isDark ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            label={t('profile.theme')}
            value={isDark ? t('profile.darkMode') : t('profile.lightMode')}
            onClick={toggleTheme}
          />
        </div>
      </motion.section>

      {/* Account Section */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>👤</span>
          {t('profile.account')}
        </h2>

        <div className="space-y-3">
          {/* Customer Code */}
          <Card variant="elevated" padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.customerCode')}</p>
                <p className="font-mono font-semibold text-gray-900 dark:text-white western-numerals">
                  {customer?.customerCode}
                </p>
              </div>
              <span className="text-2xl">🎫</span>
            </div>
          </Card>

          {/* Logout */}
          <SettingsItem
            emoji="🚪"
            icon={<LogoutIcon className="w-5 h-5" />}
            label={t('profile.logout')}
            onClick={() => setShowLogoutConfirm(true)}
            danger
          />
        </div>
      </motion.section>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <div className="text-center mb-6">
              <span className="text-5xl mb-4 block">👋</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('profile.logoutConfirmTitle')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t('profile.logoutConfirmMessage')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowLogoutConfirm(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleLogout}
                className="!bg-red-500 hover:!bg-red-600"
              >
                {t('profile.logout')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* App Version */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.3 }}
        className="text-center pt-4"
      >
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Fluff N' Woof v1.0.0
        </p>
      </motion.div>
    </motion.div>
  );
};

export default CustomerProfile;
