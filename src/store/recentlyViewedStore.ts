import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJSONStorage } from "@/lib/storage/safeLocalStorage";
import type { Product } from "@/types/product";

const MAX_ITEMS = 12;

interface RecentlyViewedState {
  productIds: string[];
  add: (product: Product) => void;
  remove: (productId: string) => void;
  clear: () => void;
  getIds: () => string[];
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      productIds: [],
      add: (product) => {
        set((state) => ({
          productIds: [
            product.id,
            ...state.productIds.filter((id) => id !== product.id),
          ].slice(0, MAX_ITEMS),
        }));
      },
      remove: (productId) => {
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        }));
      },
      clear: () => set({ productIds: [] }),
      getIds: () => get().productIds,
    }),
    { name: "vibe-recently-viewed", storage: createSafeJSONStorage() }
  )
);
