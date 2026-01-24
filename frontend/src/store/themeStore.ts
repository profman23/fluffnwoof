import { create } from 'zustand';
import { UserPreferences, FlowBoardColorConfig } from '../types';

// Brand colors available for customization
export const BRAND_COLORS = {
  pink: '#EAB8D5',
  mint: '#CEE8DC',
  gold: '#F5DF59',
  white: '#FDFEFF',
} as const;

// Brand colors as array for color picker
export const BRAND_COLOR_OPTIONS = [
  { name: 'pink', hex: '#EAB8D5', labelEn: 'Pink', labelAr: 'وردي' },
  { name: 'mint', hex: '#CEE8DC', labelEn: 'Mint', labelAr: 'نعناعي' },
  { name: 'gold', hex: '#F5DF59', labelEn: 'Gold', labelAr: 'ذهبي' },
  { name: 'white', hex: '#FDFEFF', labelEn: 'White', labelAr: 'أبيض' },
] as const;

// Default theme colors
export const DEFAULT_THEME_COLORS = {
  headerBgColor: BRAND_COLORS.mint,
  sidebarBgColor: BRAND_COLORS.mint,
  sidebarHoverColor: BRAND_COLORS.mint,
};

// Default FlowBoard column colors
export const DEFAULT_FLOWBOARD_COLORS: FlowBoardColorConfig = {
  scheduled: BRAND_COLORS.mint,
  checkIn: BRAND_COLORS.gold,
  inProgress: BRAND_COLORS.pink,
  hospitalized: BRAND_COLORS.pink,
  completed: BRAND_COLORS.mint,
};

interface ThemeState {
  preferences: UserPreferences | null;
  isLoaded: boolean;

  // Computed values for direct access (stable references)
  headerBgColor: string;
  sidebarBgColor: string;
  sidebarHoverColor: string;
  flowBoardColors: FlowBoardColorConfig;

  // Getters with defaults (for backward compatibility)
  getHeaderBgColor: () => string;
  getSidebarBgColor: () => string;
  getSidebarHoverColor: () => string;
  getFlowBoardColors: () => FlowBoardColorConfig;

  // Actions
  setPreferences: (preferences: UserPreferences | null) => void;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  clearPreferences: () => void;
  setLoaded: (loaded: boolean) => void;
}

// Helper to compute flowboard colors from preferences
function computeFlowBoardColors(preferences: UserPreferences | null): FlowBoardColorConfig {
  const prefs = preferences?.flowBoardColors || {};
  return {
    scheduled: prefs.scheduled || DEFAULT_FLOWBOARD_COLORS.scheduled,
    checkIn: prefs.checkIn || DEFAULT_FLOWBOARD_COLORS.checkIn,
    inProgress: prefs.inProgress || DEFAULT_FLOWBOARD_COLORS.inProgress,
    hospitalized: prefs.hospitalized || DEFAULT_FLOWBOARD_COLORS.hospitalized,
    completed: prefs.completed || DEFAULT_FLOWBOARD_COLORS.completed,
  };
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preferences: null,
  isLoaded: false,

  // Computed values with defaults (stable references updated via set)
  headerBgColor: DEFAULT_THEME_COLORS.headerBgColor,
  sidebarBgColor: DEFAULT_THEME_COLORS.sidebarBgColor,
  sidebarHoverColor: DEFAULT_THEME_COLORS.sidebarHoverColor,
  flowBoardColors: { ...DEFAULT_FLOWBOARD_COLORS },

  getHeaderBgColor: () => {
    return get().preferences?.headerBgColor || DEFAULT_THEME_COLORS.headerBgColor;
  },

  getSidebarBgColor: () => {
    return get().preferences?.sidebarBgColor || DEFAULT_THEME_COLORS.sidebarBgColor;
  },

  getSidebarHoverColor: () => {
    return get().preferences?.sidebarHoverColor || DEFAULT_THEME_COLORS.sidebarHoverColor;
  },

  getFlowBoardColors: () => {
    return computeFlowBoardColors(get().preferences);
  },

  setPreferences: (preferences) => {
    const flowBoardColors = computeFlowBoardColors(preferences);
    set({
      preferences,
      isLoaded: true,
      headerBgColor: preferences?.headerBgColor || DEFAULT_THEME_COLORS.headerBgColor,
      sidebarBgColor: preferences?.sidebarBgColor || DEFAULT_THEME_COLORS.sidebarBgColor,
      sidebarHoverColor: preferences?.sidebarHoverColor || DEFAULT_THEME_COLORS.sidebarHoverColor,
      flowBoardColors,
    });
    // Apply CSS variables immediately
    applyThemeToDOM(preferences);
  },

  updatePreferences: (partial) => {
    set((state) => {
      const newPrefs = state.preferences
        ? { ...state.preferences, ...partial }
        : null;
      const flowBoardColors = computeFlowBoardColors(newPrefs);
      // Apply CSS variables immediately
      applyThemeToDOM(newPrefs);
      return {
        preferences: newPrefs,
        headerBgColor: newPrefs?.headerBgColor || DEFAULT_THEME_COLORS.headerBgColor,
        sidebarBgColor: newPrefs?.sidebarBgColor || DEFAULT_THEME_COLORS.sidebarBgColor,
        sidebarHoverColor: newPrefs?.sidebarHoverColor || DEFAULT_THEME_COLORS.sidebarHoverColor,
        flowBoardColors,
      };
    });
  },

  clearPreferences: () => {
    set({
      preferences: null,
      isLoaded: false,
      headerBgColor: DEFAULT_THEME_COLORS.headerBgColor,
      sidebarBgColor: DEFAULT_THEME_COLORS.sidebarBgColor,
      sidebarHoverColor: DEFAULT_THEME_COLORS.sidebarHoverColor,
      flowBoardColors: { ...DEFAULT_FLOWBOARD_COLORS },
    });
    // Reset to defaults
    applyThemeToDOM(null);
  },

  setLoaded: (loaded) => set({ isLoaded: loaded }),
}));

// Helper function to apply theme colors to DOM via CSS variables
function applyThemeToDOM(preferences: UserPreferences | null) {
  const root = document.documentElement;

  // Apply theme colors
  root.style.setProperty(
    '--header-bg-color',
    preferences?.headerBgColor || DEFAULT_THEME_COLORS.headerBgColor
  );
  root.style.setProperty(
    '--sidebar-bg-color',
    preferences?.sidebarBgColor || DEFAULT_THEME_COLORS.sidebarBgColor
  );
  root.style.setProperty(
    '--sidebar-hover-color',
    preferences?.sidebarHoverColor || DEFAULT_THEME_COLORS.sidebarHoverColor
  );

  // Apply FlowBoard colors
  const flowColors = preferences?.flowBoardColors || {};
  root.style.setProperty(
    '--flowboard-scheduled',
    flowColors.scheduled || DEFAULT_FLOWBOARD_COLORS.scheduled!
  );
  root.style.setProperty(
    '--flowboard-checkin',
    flowColors.checkIn || DEFAULT_FLOWBOARD_COLORS.checkIn!
  );
  root.style.setProperty(
    '--flowboard-inprogress',
    flowColors.inProgress || DEFAULT_FLOWBOARD_COLORS.inProgress!
  );
  root.style.setProperty(
    '--flowboard-hospitalized',
    flowColors.hospitalized || DEFAULT_FLOWBOARD_COLORS.hospitalized!
  );
  root.style.setProperty(
    '--flowboard-completed',
    flowColors.completed || DEFAULT_FLOWBOARD_COLORS.completed!
  );
}
