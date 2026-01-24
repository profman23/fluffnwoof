import { UserPreferences } from '@prisma/client';
import prisma from '../lib/prisma';

// Brand colors for FlowBoard columns
export const DEFAULT_FLOWBOARD_COLORS = {
  scheduled: '#CEE8DC',    // Mint
  checkIn: '#F5DF59',      // Gold
  inProgress: '#EAB8D5',   // Pink
  hospitalized: '#EAB8D5', // Pink
  completed: '#CEE8DC',    // Mint
};

// Default theme colors
export const DEFAULT_THEME_COLORS = {
  headerBgColor: '#CEE8DC',    // Mint
  sidebarBgColor: '#CEE8DC',   // Mint
  sidebarHoverColor: '#CEE8DC', // Mint
};

interface FlowBoardColorConfig {
  [key: string]: string | undefined;
  scheduled?: string;
  checkIn?: string;
  inProgress?: string;
  hospitalized?: string;
  completed?: string;
}

interface UpdatePreferencesInput {
  headerBgColor?: string;
  sidebarBgColor?: string;
  sidebarHoverColor?: string;
  flowBoardColors?: FlowBoardColorConfig;
}

export const userPreferencesService = {
  /**
   * Get user preferences by userId
   * Returns defaults if no preferences exist
   */
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    return preferences;
  },

  /**
   * Get user preferences with defaults applied
   */
  async getPreferencesWithDefaults(userId: string) {
    const preferences = await this.getPreferences(userId);

    return {
      id: preferences?.id || null,
      userId,
      headerBgColor: preferences?.headerBgColor || DEFAULT_THEME_COLORS.headerBgColor,
      sidebarBgColor: preferences?.sidebarBgColor || DEFAULT_THEME_COLORS.sidebarBgColor,
      sidebarHoverColor: preferences?.sidebarHoverColor || DEFAULT_THEME_COLORS.sidebarHoverColor,
      flowBoardColors: {
        ...DEFAULT_FLOWBOARD_COLORS,
        ...(preferences?.flowBoardColors as FlowBoardColorConfig || {}),
      },
      createdAt: preferences?.createdAt || null,
      updatedAt: preferences?.updatedAt || null,
    };
  },

  /**
   * Create or update user preferences
   * Uses upsert to handle both cases
   */
  async updatePreferences(userId: string, data: UpdatePreferencesInput): Promise<UserPreferences> {
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        headerBgColor: data.headerBgColor,
        sidebarBgColor: data.sidebarBgColor,
        sidebarHoverColor: data.sidebarHoverColor,
        flowBoardColors: data.flowBoardColors || null,
      },
      update: {
        headerBgColor: data.headerBgColor,
        sidebarBgColor: data.sidebarBgColor,
        sidebarHoverColor: data.sidebarHoverColor,
        flowBoardColors: data.flowBoardColors || undefined,
      },
    });

    return preferences;
  },

  /**
   * Reset user preferences to defaults
   */
  async resetPreferences(userId: string): Promise<void> {
    await prisma.userPreferences.deleteMany({
      where: { userId },
    });
  },
};
