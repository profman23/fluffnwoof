/**
 * Sidebar State Management
 * Handles sidebar collapsed/expanded state with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  isAnimating: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setAnimating: (animating: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isAnimating: false,

      toggleCollapse: () => {
        set((state) => {
          // Start animation
          set({ isAnimating: true });

          // End animation after transition completes
          setTimeout(() => {
            set({ isAnimating: false });
          }, 300);

          return { isCollapsed: !state.isCollapsed };
        });
      },

      setCollapsed: (collapsed: boolean) => {
        set({ isAnimating: true });
        setTimeout(() => {
          set({ isAnimating: false });
        }, 300);
        set({ isCollapsed: collapsed });
      },

      setAnimating: (animating: boolean) => set({ isAnimating: animating }),
    }),
    {
      name: 'fluffnwoof-sidebar',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);
