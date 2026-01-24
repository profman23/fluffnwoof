import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { profileApi } from '../api/profile';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const { setPreferences, setLoaded, isLoaded } = useThemeStore();

  useEffect(() => {
    const loadPreferences = async () => {
      if (isAuthenticated && !isLoaded) {
        try {
          const preferences = await profileApi.getPreferences();
          setPreferences(preferences);
        } catch (error) {
          console.error('Failed to load user preferences:', error);
          // Set loaded even on error to prevent infinite retries
          setLoaded(true);
        }
      }
    };

    loadPreferences();
  }, [isAuthenticated, isLoaded, setPreferences, setLoaded]);

  // Clear preferences on logout
  useEffect(() => {
    if (!isAuthenticated) {
      useThemeStore.getState().clearPreferences();
    }
  }, [isAuthenticated]);

  return <>{children}</>;
};
