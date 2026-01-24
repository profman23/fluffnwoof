import apiClient from './client';
import { User, UserPreferences, UpdatePreferencesInput, UpdateProfileInput } from '../types';

export const profileApi = {
  /**
   * Get current user's profile
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/profile');
    return response.data.data;
  },

  /**
   * Update current user's profile (name)
   */
  updateProfile: async (data: UpdateProfileInput): Promise<User> => {
    const response = await apiClient.put('/profile', data);
    return response.data.data;
  },

  /**
   * Get current user's preferences
   */
  getPreferences: async (): Promise<UserPreferences> => {
    const response = await apiClient.get('/profile/preferences');
    return response.data.data;
  },

  /**
   * Update current user's preferences
   */
  updatePreferences: async (data: UpdatePreferencesInput): Promise<UserPreferences> => {
    const response = await apiClient.put('/profile/preferences', data);
    return response.data.data;
  },

  /**
   * Reset preferences to defaults
   */
  resetPreferences: async (): Promise<UserPreferences> => {
    const response = await apiClient.delete('/profile/preferences');
    return response.data.data;
  },
};
