/**
 * Dark Mode Context
 * Provides theme management (light/dark/system) for the admin dashboard
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

// ============================================
// TYPES
// ============================================

export type DarkMode = 'light' | 'dark' | 'system';
export type ResolvedDarkMode = 'light' | 'dark';

interface DarkModeContextType {
  mode: DarkMode;
  resolvedMode: ResolvedDarkMode;
  isDark: boolean;
  setMode: (mode: DarkMode) => void;
  toggleMode: () => void;
}

// ============================================
// CONTEXT
// ============================================

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

// ============================================
// STORAGE KEY
// ============================================

const DARK_MODE_STORAGE_KEY = 'admin-dark-mode';

// ============================================
// PROVIDER
// ============================================

interface DarkModeProviderProps {
  children: React.ReactNode;
  defaultMode?: DarkMode;
}

export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({
  children,
  defaultMode = 'system',
}) => {
  // Initialize theme mode from localStorage or default
  const [mode, setModeState] = useState<DarkMode>(() => {
    if (typeof window === 'undefined') return defaultMode;

    const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as DarkMode;
    }
    return defaultMode;
  });

  // Track system preference
  const [systemPreference, setSystemPreference] = useState<ResolvedDarkMode>(() => {
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
  const resolvedMode: ResolvedDarkMode = useMemo(() => {
    if (mode === 'system') {
      return systemPreference;
    }
    return mode;
  }, [mode, systemPreference]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (resolvedMode === 'dark') {
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
        resolvedMode === 'dark' ? '#0f0f10' : '#FDFEFF'
      );
    }
  }, [resolvedMode]);

  // Save theme mode to localStorage
  const setMode = useCallback((newMode: DarkMode) => {
    setModeState(newMode);
    localStorage.setItem(DARK_MODE_STORAGE_KEY, newMode);
  }, []);

  // Toggle between light and dark
  const toggleMode = useCallback(() => {
    const newMode = resolvedMode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
  }, [resolvedMode, setMode]);

  // Context value
  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      isDark: resolvedMode === 'dark',
      setMode,
      toggleMode,
    }),
    [mode, resolvedMode, setMode, toggleMode]
  );

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

// ============================================
// HOOKS
// ============================================

/**
 * Main hook to access dark mode context
 */
export const useDarkMode = (): DarkModeContextType => {
  const context = useContext(DarkModeContext);

  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }

  return context;
};

/**
 * Hook to get themed class names
 */
export const useDarkClass = (lightClass: string, darkClass: string): string => {
  const { isDark } = useDarkMode();
  return isDark ? darkClass : lightClass;
};

/**
 * Hook to get themed value
 */
export const useDarkValue = <T,>(lightValue: T, darkValue: T): T => {
  const { isDark } = useDarkMode();
  return isDark ? darkValue : lightValue;
};

export default DarkModeContext;
