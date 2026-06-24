import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJSONStorage } from "@/lib/storage/safeLocalStorage";
import type { Product } from "@/types/product";

const MAX_COMPARE = 4;

export interface CompareItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  imageColor: string;
  availability: Product["availability"];
  rating: number;
  reviewCount: number;
}

interface CompareState {
  items: CompareItem[];
  add: (product: Product) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
}

function toCompareItem(product: Product): CompareItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: product.image,
    imageColor: product.imageColor,
    availability: product.availability,
    rating: product.rating,
    reviewCount: product.reviewCount,
  };
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      add(product) {
        const existing = get().items;
        if (existing.some((item) => item.productId === product.id)) {
          return true;
        }
        if (existing.length >= MAX_COMPARE) {
          return false;
        }
        set({ items: [...existing, toCompareItem(product)] });
        return true;
      },
      remove(productId) {
        set({ items: get().items.filter((item) => item.productId !== productId) });
      },
      clear() {
        set({ items: [] });
      },
      has(productId) {
        return get().items.some((item) => item.productId === productId);
      },
    }),
    {
      name: "vibe-compare",
      storage: createSafeJSONStorage(),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
