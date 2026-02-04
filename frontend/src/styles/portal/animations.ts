/**
 * Portal Animations
 * Framer Motion animation variants for smooth transitions
 */

import { Variants, Transition } from 'framer-motion';

// ============================================
// TRANSITIONS
// ============================================

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

export const bounceTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 15,
};

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageSlide: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    transition: {
      ...springTransition,
      duration: 0.2,
    },
  }),
};

export const pageFade: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const pageSlideUp: Variants = {
  initial: {
    y: 20,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: smoothTransition,
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================
// ELEMENT ANIMATIONS
// ============================================

export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
};

// Simple animation objects for direct use with initial/animate props
export const fadeInUpSimple = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: smoothTransition,
};

export const fadeInDown: Variants = {
  initial: {
    opacity: 0,
    y: -20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
};

export const fadeInLeft: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: smoothTransition,
  },
};

export const fadeInRight: Variants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: smoothTransition,
  },
};

export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: smoothTransition,
  },
};

export const scaleInBounce: Variants = {
  initial: {
    opacity: 0,
    scale: 0.5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: bounceTransition,
  },
};

// ============================================
// CONTAINER ANIMATIONS (Stagger children)
// ============================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
};

// ============================================
// MODAL & BOTTOM SHEET
// ============================================

export const modalBackdrop: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

export const bottomSheet: Variants = {
  initial: {
    y: '100%',
  },
  animate: {
    y: 0,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 300,
    },
  },
  exit: {
    y: '100%',
    transition: {
      duration: 0.25,
      ease: 'easeIn',
    },
  },
};

export const modalCenter: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
};

// ============================================
// INTERACTIVE STATES
// ============================================

export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const hoverLift = {
  y: -2,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
  transition: { duration: 0.2 },
};

export const buttonTap = {
  scale: 0.97,
};

export const cardHover = {
  y: -4,
  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
  transition: { duration: 0.2 },
};

// ============================================
// NAVIGATION ANIMATIONS
// ============================================

export const navIndicator: Variants = {
  initial: {
    opacity: 0,
    scale: 0,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: bounceTransition,
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: { duration: 0.15 },
  },
};

export const navIcon: Variants = {
  inactive: {
    scale: 1,
    color: 'var(--nav-inactive)',
  },
  active: {
    scale: 1.1,
    color: 'var(--nav-active)',
    transition: bounceTransition,
  },
};

// ============================================
// SUCCESS ANIMATIONS
// ============================================

export const successCheck: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.1,
    },
  },
};

export const successCircle: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

export const confetti: Variants = {
  initial: {
    y: 0,
    opacity: 1,
    scale: 1,
  },
  animate: {
    y: [0, -100, 200],
    opacity: [1, 1, 0],
    scale: [1, 1.2, 0.8],
    rotate: [0, 180, 360],
    transition: {
      duration: 1.5,
      ease: 'easeOut',
    },
  },
};

// ============================================
// LOADING ANIMATIONS
// ============================================

export const pulse: Variants = {
  initial: {
    opacity: 0.6,
  },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const spin: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const bounce: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const shimmer: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================
// NOTIFICATION ANIMATIONS
// ============================================

export const slideInRight: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const slideInTop: Variants = {
  initial: {
    y: '-100%',
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    y: '-100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const slideInBottom: Variants = {
  initial: {
    y: '100%',
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a delayed animation variant
 */
export const withDelay = (variant: Variants, delay: number): Variants => ({
  ...variant,
  animate: {
    ...variant.animate,
    transition: {
      ...(typeof variant.animate === 'object' && 'transition' in variant.animate
        ? variant.animate.transition
        : {}),
      delay,
    },
  },
});

/**
 * Create stagger children with custom timing
 */
export const createStagger = (
  staggerTime: number = 0.08,
  delayStart: number = 0.1
): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerTime,
      delayChildren: delayStart,
    },
  },
});

export default {
  // Page
  pageSlide,
  pageFade,
  pageSlideUp,
  // Elements
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  scaleInBounce,
  // Containers
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,
  staggerItem,
  // Modals
  modalBackdrop,
  bottomSheet,
  modalCenter,
  // Interactive
  tapScale,
  hoverScale,
  hoverLift,
  buttonTap,
  cardHover,
  // Navigation
  navIndicator,
  navIcon,
  // Success
  successCheck,
  successCircle,
  confetti,
  // Loading
  pulse,
  spin,
  bounce,
  shimmer,
  // Notifications
  slideInRight,
  slideInTop,
  slideInBottom,
  // Utilities
  withDelay,
  createStagger,
};
