import { create } from "zustand";

interface FilterUIState {
  mobileDrawerOpen: boolean;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleMobileDrawer: () => void;
}

export const useFilterStore = create<FilterUIState>((set) => ({
  mobileDrawerOpen: false,
  openMobileDrawer: () => set({ mobileDrawerOpen: true }),
  closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
  toggleMobileDrawer: () =>
    set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
}));
