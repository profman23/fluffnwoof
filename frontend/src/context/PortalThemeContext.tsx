/**
 * Portal Theme Context
 * Provides theme management (light/dark/system) for the customer portal
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { lightTheme, darkTheme, type Theme, type ThemeMode, type ResolvedTheme } from '../styles/portal/theme';

// ============================================
// TYPES
// ============================================

interface PortalThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// ============================================
// CONTEXT
// ============================================

const PortalThemeContext = createContext<PortalThemeContextType | undefined>(undefined);

// ============================================
// STORAGE KEY
// ============================================

const THEME_STORAGE_KEY = 'portal-theme-mode';

// ============================================
// PROVIDER
// ============================================

interface PortalThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}

export const PortalThemeProvider: React.FC<PortalThemeProviderProps> = ({
  children,
  defaultMode = 'system',
}) => {
  // Initialize theme mode from localStorage or default
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultMode;

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as ThemeMode;
    }
    return defaultMode;
  });

  // Track system preference
  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Legacy support
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Resolve the actual theme to use
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemPreference;
    }
    return themeMode;
  }, [themeMode, systemPreference]);

  // Get theme object
  const theme = useMemo(() => {
    return resolvedTheme === 'dark' ? darkTheme : lightTheme;
  }, [resolvedTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#0A0A0A' : '#FFFFFF'
      );
    }
  }, [resolvedTheme]);

  // Save theme mode to localStorage
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  }, [resolvedTheme, setThemeMode]);

  // Context value
  const value = useMemo(
    () => ({
      theme,
      themeMode,
      resolvedTheme,
      setThemeMode,
      toggleTheme,
      isDark: resolvedTheme === 'dark',
    }),
    [theme, themeMode, resolvedTheme, setThemeMode, toggleTheme]
  );

  return (
    <PortalThemeContext.Provider value={value}>
      {children}
    </PortalThemeContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const usePortalTheme = (): PortalThemeContextType => {
  const context = useContext(PortalThemeContext);

  if (context === undefined) {
    throw new Error('usePortalTheme must be used within a PortalThemeProvider');
  }

  return context;
};

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook to get themed class names
 */
export const useThemedClass = (lightClass: string, darkClass: string): string => {
  const { isDark } = usePortalTheme();
  return isDark ? darkClass : lightClass;
};

/**
 * Hook to get themed value
 */
export const useThemedValue = <T,>(lightValue: T, darkValue: T): T => {
  const { isDark } = usePortalTheme();
  return isDark ? darkValue : lightValue;
};

export default PortalThemeContext;
