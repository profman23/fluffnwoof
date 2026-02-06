/**
 * Mobile Video Intro Component
 * Shows fullscreen video on mobile/tablet with "Slide to Login" gesture
 * Used by both Admin Login and Customer Portal
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ============================================
// ICONS
// ============================================

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

// ============================================
// TYPES
// ============================================

export interface MobileVideoIntroProps {
  /** Called when user dismisses the intro */
  onDismiss: () => void;
  /** Video source URL */
  videoSrc?: string;
  /** Whether to show language switcher */
  showLanguageSwitcher?: boolean;
  /** Custom language toggle handler */
  onLanguageToggle?: () => void;
  /** Namespace for translations */
  translationNamespace?: string;
}

// ============================================
// SLIDE TO LOGIN BUTTON
// ============================================

interface SlideToLoginProps {
  onSlide: () => void;
  label: string;
}

const SlideToLogin: React.FC<SlideToLoginProps> = ({ onSlide, label }) => {
  const [dragProgress, setDragProgress] = useState(0);
  const SLIDE_THRESHOLD = -80; // pixels to slide up to trigger

  const handleDrag = useCallback((_: any, info: PanInfo) => {
    // Calculate progress (0 to 1) based on drag
    const progress = Math.min(Math.abs(info.offset.y) / Math.abs(SLIDE_THRESHOLD), 1);
    setDragProgress(progress);
  }, []);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.y < SLIDE_THRESHOLD) {
      onSlide();
    }
    setDragProgress(0);
  }, [onSlide]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Animated Arrow */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-white/80"
      >
        <ChevronUpIcon className="w-6 h-6" />
      </motion.div>

      {/* Slide Button */}
      <motion.button
        drag="y"
        dragConstraints={{ top: -100, bottom: 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={onSlide}
        whileTap={{ scale: 0.98 }}
        className="relative px-8 py-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium shadow-lg cursor-pointer touch-none select-none"
        style={{
          opacity: 1 - dragProgress * 0.3,
        }}
      >
        <span className="flex items-center gap-2">
          {label}
        </span>

        {/* Progress indicator */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/30"
          style={{
            scaleX: dragProgress,
            transformOrigin: 'left',
          }}
        />
      </motion.button>

      {/* Hint text */}
      <p className="text-white/60 text-xs">
        {dragProgress > 0.5 ? '...' : ''}
      </p>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const MobileVideoIntro: React.FC<MobileVideoIntroProps> = ({
  onDismiss,
  videoSrc = '/videos/login_page.mp4',
  showLanguageSwitcher = true,
  onLanguageToggle,
  translationNamespace = 'auth',
}) => {
  const { t, i18n } = useTranslation(translationNamespace);
  const [isExiting, setIsExiting] = useState(false);

  const handleLanguageToggle = () => {
    if (onLanguageToggle) {
      onLanguageToggle();
    } else {
      const newLang = i18n.language === 'ar' ? 'en' : 'ar';
      i18n.changeLanguage(newLang);
      localStorage.setItem('language', newLang);
      document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLang;
    }
  };

  const handleDismiss = () => {
    setIsExiting(true);
    // Small delay to allow exit animation
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col"
        >
          {/* Video Background */}
          <div className="absolute inset-0 bg-brand-dark">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={videoSrc} type="video/mp4" />
            </video>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full safe-area-inset">
            {/* Header - Language Switcher Only (Logo is in the video) */}
            <header className="flex items-center justify-end p-4">
              {/* Language Switcher */}
              {showLanguageSwitcher && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={handleLanguageToggle}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium"
                >
                  <GlobeIcon className="w-4 h-4" />
                  {i18n.language === 'ar' ? 'English' : 'عربي'}
                </motion.button>
              )}
            </header>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 pb-10"
            >
              {/* Slide to Login */}
              <SlideToLogin
                onSlide={handleDismiss}
                label={t('slideToLogin', 'Slide to Login')}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileVideoIntro;
