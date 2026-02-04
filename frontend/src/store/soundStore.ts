/**
 * Sound Preferences Store
 *
 * Zustand store for managing notification sound preferences.
 * Persists user preferences to localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// Types
// ============================================

interface SoundState {
  /** Whether notification sounds are muted */
  isMuted: boolean;
  /** Volume level (0.0 to 1.0) */
  volume: number;
}

interface SoundActions {
  /** Set mute state */
  setMuted: (muted: boolean) => void;
  /** Toggle mute state */
  toggleMuted: () => void;
  /** Set volume level (clamped between 0 and 1) */
  setVolume: (volume: number) => void;
}

type SoundStore = SoundState & SoundActions;

// ============================================
// Store
// ============================================

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      // Initial state
      isMuted: false,
      volume: 0.5,

      // Actions
      setMuted: (muted) => set({ isMuted: muted }),

      toggleMuted: () => set((state) => ({ isMuted: !state.isMuted })),

      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }),
    }),
    {
      name: 'fluff-sound-preferences',
      // Only persist these fields
      partialize: (state) => ({
        isMuted: state.isMuted,
        volume: state.volume,
      }),
    }
  )
);
