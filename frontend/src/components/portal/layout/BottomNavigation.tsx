/**
 * Portal Bottom Navigation
 * Mobile-first bottom navigation bar with colored emojis
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ============================================
// TYPES
// ============================================

interface NavItem {
  path: string;
  label: string;
  emoji: string;
  isMain?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export const BottomNavigation: React.FC = () => {
  const { t } = useTranslation('portal');
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/portal/dashboard', label: t('nav.home'), emoji: '🏠' },
    { path: '/portal/pets', label: t('nav.pets'), emoji: '🐾' },
    { path: '/portal/book', label: t('nav.book'), emoji: '➕', isMain: true },
    { path: '/portal/appointments', label: t('nav.appointments'), emoji: '📅' },
    { path: '/portal/profile', label: t('nav.profile'), emoji: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/portal/dashboard' && location.pathname.startsWith(item.path));

          if (item.isMain) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative -mt-6"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`
                    w-14 h-14
                    rounded-full
                    flex items-center justify-center
                    shadow-lg shadow-gold-300/50
                    ${isActive
                      ? 'bg-gold-400'
                      : 'bg-gold-300 hover:bg-gold-400'
                    }
                  `}
                >
                  <span className="text-2xl">{item.emoji}</span>
                </motion.div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center py-2"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 transition-all duration-200"
              >
                <div className="relative">
                  <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                    {item.emoji}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold-400 rounded-full"
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${
                  isActive
                    ? 'text-mint-600 dark:text-mint-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {item.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
