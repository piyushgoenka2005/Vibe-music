"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminTheme = "light" | "dark";

interface AdminUiState {
  theme: AdminTheme;
  sidebarCollapsed: boolean;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useAdminUiStore = create<AdminUiState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () =>
        set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    { name: "vibe-admin-ui" }
  )
);
