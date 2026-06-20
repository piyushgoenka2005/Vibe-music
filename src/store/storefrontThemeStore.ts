"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyStorefrontTheme,
  normalizeStorefrontTheme,
  STOREFRONT_THEME_STORAGE_KEY,
  type StorefrontTheme,
} from "@/lib/storefrontTheme";

export type { StorefrontTheme };

interface StorefrontThemeState {
  theme: StorefrontTheme;
  setTheme: (theme: StorefrontTheme) => void;
  toggleTheme: () => void;
}

export const useStorefrontThemeStore = create<StorefrontThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => {
        const next = normalizeStorefrontTheme(theme);
        applyStorefrontTheme(next);
        set({ theme: next });
      },
      toggleTheme: () => {
        const current = get().theme;
        const next: StorefrontTheme =
          current === "light" ? "dark" : current === "dark" ? "dim" : "light";
        applyStorefrontTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: STOREFRONT_THEME_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const theme = normalizeStorefrontTheme(state.theme);
        state.theme = theme;
        applyStorefrontTheme(theme);
      },
    }
  )
);
