/**
 * Portal Theme Configuration
 * Fluff N' Woof Customer Portal
 *
 * Color Palette:
 * - Mint Green (Primary)
 * - Pink (Accent/Secondary)
 * - Gold/Yellow (Highlight)
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Brand Mint Green - Primary
  mint: {
    50: '#F0F9F4',
    100: '#DCF2E6',
    200: '#CEE8DC', // brand-mint
    300: '#A8D5C2',
    400: '#7FC2A8',
    500: '#56AF8E',
    600: '#3D9B78',
    700: '#2D7A5E',
    800: '#1F5A45',
    900: '#123B2C',
  },

  // Brand Pink - Secondary/Accent
  pink: {
    50: '#FDF5F9',
    100: '#FAEAF3',
    200: '#F5D5E7',
    300: '#EAB8D5', // brand-pink
    400: '#E091C0',
    500: '#D66AAB',
    600: '#C44896',
    700: '#A33579',
    800: '#82295E',
    900: '#611E45',
  },

  // Brand Gold - Highlight
  gold: {
    50: '#FFFDF5',
    100: '#FFFBE6',
    200: '#FDF6CC',
    300: '#F5DF59', // brand-gold
    400: '#E8C840',
    500: '#D4B02E',
    600: '#B8951F',
    700: '#957717',
    800: '#725A11',
    900: '#4F3E0C',
  },

  // Neutral Grays
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic Colors
  success: {
    light: '#10B981',
    dark: '#34D399',
  },
  warning: {
    light: '#F59E0B',
    dark: '#FBBF24',
  },
  error: {
    light: '#EF4444',
    dark: '#F87171',
  },
  info: {
    light: '#3B82F6',
    dark: '#60A5FA',
  },
};

// ============================================
// LIGHT THEME
// ============================================

export const lightTheme = {
  name: 'light' as const,

  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F7F6',
    tertiary: colors.mint[50],
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text Colors - Using gray instead of pure black
  text: {
    primary: '#374151', // gray-700 - main text
    secondary: '#6B7280', // gray-500 - secondary text
    tertiary: '#9CA3AF', // gray-400 - muted text
    inverse: '#FFFFFF',
    brand: colors.mint[600],
    accent: colors.pink[600],
  },

  // Border Colors
  border: {
    default: colors.neutral[200],
    light: colors.neutral[100],
    focus: colors.mint[400],
    error: colors.error.light,
  },

  // Button Variants
  button: {
    primary: {
      bg: colors.mint[500],
      bgHover: colors.mint[600],
      text: '#FFFFFF',
    },
    secondary: {
      bg: colors.pink[300],
      bgHover: colors.pink[400],
      text: colors.pink[800],
    },
    ghost: {
      bg: 'transparent',
      bgHover: colors.mint[50],
      text: colors.mint[600],
    },
    outline: {
      bg: 'transparent',
      bgHover: colors.mint[50],
      text: colors.mint[600],
      border: colors.mint[300],
    },
    danger: {
      bg: colors.error.light,
      bgHover: '#DC2626',
      text: '#FFFFFF',
    },
  },

  // Status Colors
  status: {
    success: colors.success.light,
    warning: colors.warning.light,
    error: colors.error.light,
    info: colors.info.light,
    scheduled: colors.mint[500],
    confirmed: colors.mint[600],
    inProgress: colors.gold[500],
    completed: colors.success.light,
    cancelled: colors.error.light,
  },

  // Navigation
  navigation: {
    bg: '#FFFFFF',
    border: colors.neutral[200],
    active: colors.mint[500],
    inactive: colors.neutral[400],
    activeText: colors.mint[600],
    inactiveText: colors.neutral[500],
  },

  // Input Fields
  input: {
    bg: '#FFFFFF',
    border: colors.neutral[300],
    borderFocus: colors.mint[400],
    placeholder: colors.neutral[400],
    text: '#374151',
  },

  // Cards
  card: {
    bg: '#FFFFFF',
    border: colors.neutral[200],
    shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
};

// ============================================
// DARK THEME
// ============================================

export const darkTheme = {
  name: 'dark' as const,

  // Backgrounds
  background: {
    primary: '#0A0A0A',
    secondary: '#141414',
    tertiary: '#1A1A1A',
    card: '#1F1F1F',
    elevated: '#262626',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Text Colors
  text: {
    primary: '#F5F5F5',
    secondary: '#A3A3A3',
    tertiary: '#737373',
    inverse: '#171717',
    brand: colors.mint[400],
    accent: colors.pink[400],
  },

  // Border Colors
  border: {
    default: '#333333',
    light: '#262626',
    focus: colors.mint[500],
    error: colors.error.dark,
  },

  // Button Variants
  button: {
    primary: {
      bg: colors.mint[500],
      bgHover: colors.mint[400],
      text: '#FFFFFF',
    },
    secondary: {
      bg: colors.pink[500],
      bgHover: colors.pink[400],
      text: '#FFFFFF',
    },
    ghost: {
      bg: 'transparent',
      bgHover: 'rgba(206, 232, 220, 0.1)',
      text: colors.mint[400],
    },
    outline: {
      bg: 'transparent',
      bgHover: 'rgba(206, 232, 220, 0.1)',
      text: colors.mint[400],
      border: colors.mint[600],
    },
    danger: {
      bg: colors.error.dark,
      bgHover: '#EF4444',
      text: '#FFFFFF',
    },
  },

  // Status Colors
  status: {
    success: colors.success.dark,
    warning: colors.warning.dark,
    error: colors.error.dark,
    info: colors.info.dark,
    scheduled: colors.mint[400],
    confirmed: colors.mint[500],
    inProgress: colors.gold[400],
    completed: colors.success.dark,
    cancelled: colors.error.dark,
  },

  // Navigation
  navigation: {
    bg: '#0A0A0A',
    border: '#262626',
    active: colors.mint[400],
    inactive: colors.neutral[600],
    activeText: colors.mint[400],
    inactiveText: colors.neutral[500],
  },

  // Input Fields
  input: {
    bg: '#1F1F1F',
    border: '#404040',
    borderFocus: colors.mint[500],
    placeholder: colors.neutral[600],
    text: '#F5F5F5',
  },

  // Cards
  card: {
    bg: '#1F1F1F',
    border: '#333333',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
};

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  fontFamily: {
    arabic: "'GE Dinar One', 'Noto Sans Arabic', 'Segoe UI', sans-serif",
    english: "'DIN Next', 'Inter', system-ui, -apple-system, sans-serif",
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ============================================
// SPACING
// ============================================

export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
};

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem', // 32px
  full: '9999px',
};

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.12)',
  elevated: '0 8px 24px rgba(0, 0, 0, 0.12)',
  bottomNav: '0 -4px 12px rgba(0, 0, 0, 0.08)',
  modal: '0 -8px 32px rgba(0, 0, 0, 0.2)',
};

// ============================================
// TRANSITIONS
// ============================================

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// ============================================
// Z-INDEX
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
};

// ============================================
// BREAKPOINTS (for reference, Tailwind handles these)
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================
// TYPE EXPORTS
// ============================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type Theme = typeof lightTheme | typeof darkTheme;

// ============================================
// THEME GETTER
// ============================================

export const getTheme = (mode: ResolvedTheme): Theme => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

export default {
  colors,
  lightTheme,
  darkTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  getTheme,
};
