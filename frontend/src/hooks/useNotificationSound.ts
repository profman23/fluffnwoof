/**
 * useNotificationSound Hook
 *
 * React hook for playing pet-species-specific notification sounds.
 * Handles browser autoplay policies and syncs with user preferences.
 */

import { useCallback, useEffect } from 'react';
import { soundService } from '../services/soundService';
import { useSoundStore } from '../store/soundStore';

/**
 * Hook for playing notification sounds based on pet species.
 *
 * @example
 * ```tsx
 * const { playNotificationSound } = useNotificationSound();
 *
 * // Play species-specific sound
 * playNotificationSound('DOG'); // Plays dog bark
 * playNotificationSound('CAT'); // Plays cat meow
 *
 * // Play default sound
 * playNotificationSound(); // Plays default notification
 * ```
 */
export const useNotificationSound = () => {
  const { isMuted, volume } = useSoundStore();

  // Sync store state with service
  useEffect(() => {
    soundService.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    soundService.setVolume(volume);
  }, [volume]);

  // Initialize sound service on first user interaction
  // Required due to browser autoplay policies
  useEffect(() => {
    const handleInteraction = () => {
      soundService.initialize();
    };

    // Listen for any user interaction
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, handleInteraction, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  /**
   * Play notification sound for a species.
   *
   * @param species - Optional pet species (e.g., 'DOG', 'CAT', 'BIRD').
   *                  If not provided, plays the default notification sound.
   */
  const playNotificationSound = useCallback((species?: string) => {
    soundService.playForSpecies(species);
  }, []);

  return { playNotificationSound };
};
