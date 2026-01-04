import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // Vision page view mode
  visionViewMode: 'grid' | 'kanban';
  setVisionViewMode: (mode: 'grid' | 'kanban') => void;

  // Sidebar collapsed state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Vision view mode
      visionViewMode: 'grid',
      setVisionViewMode: (mode) => set({ visionViewMode: mode }),

      // Sidebar state
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'gap-ui-preferences',
      partialize: (state) => ({
        visionViewMode: state.visionViewMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
