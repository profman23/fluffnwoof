/**
 * Portal Top Header
 * App header with logo, notifications, and settings
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePortalTheme } from '../../../context/PortalThemeContext';

// ============================================
// ICONS
// ============================================

const BellIcon: React.FC = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

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

const ChevronLeftIcon: React.FC = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

// ============================================
// TYPES
// ============================================

export interface TopHeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showThemeToggle?: boolean;
  notificationCount?: number;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  onBack?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  showBack = false,
  showNotifications = true,
  showThemeToggle = true,
  notificationCount = 0,
  rightAction,
  transparent = false,
  onBack,
}) => {
  const { t, i18n } = useTranslation('portal');
  const navigate = useNavigate();
  const { isDark, toggleTheme } = usePortalTheme();
  const isRtl = i18n.language === 'ar';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={`
        sticky top-0 z-40
        px-4 h-14
        flex items-center justify-between
        safe-area-top
        ${transparent
          ? 'bg-transparent'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800'
        }
      `}
    >
      {/* Left Section */}
      <div className="flex items-center gap-2 min-w-[48px]">
        {showBack ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            className="p-2 -ms-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <div className={isRtl ? 'rotate-180' : ''}>
              <ChevronLeftIcon />
            </div>
          </motion.button>
        ) : (
          <Link to="/portal/dashboard" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Fluff N' Woof"
              className="w-12 h-12 object-contain"
            />
          </Link>
        )}
      </div>

      {/* Title (Center) */}
      {title && (
        <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-1">
        {rightAction}

        {/* Theme Toggle */}
        {showThemeToggle && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300 transition-colors"
            aria-label={isDark ? t('lightMode', 'الوضع الفاتح') : t('darkMode', 'الوضع الداكن')}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </motion.button>
        )}

        {/* Notifications */}
        {showNotifications && (
          <Link to="/portal/notifications">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="relative p-2 text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300 transition-colors"
            >
              <BellIcon />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-pink-500 rounded-full px-1">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </motion.div>
          </Link>
        )}
      </div>
    </header>
  );
};

// ============================================
// PAGE HEADER (for inner pages)
// ============================================

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => (
  <div className={`flex items-start justify-between mb-6 ${className}`}>
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export default TopHeader;
