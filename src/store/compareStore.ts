import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJSONStorage } from "@/lib/storage/safeLocalStorage";
import { canAddCompareItem, mergeCompareItems, normalizeCompareItems } from "@/lib/compare/compareEngine";
import { useAuthStore } from "@/store/authStore";
import type { CompareItemRecord } from "@/types/compare";
import type { Product } from "@/types/product";

export type CompareItem = CompareItemRecord;

const MAX_COMPARE = 4;

interface CompareState {
  items: CompareItem[];
  _hydrated: boolean;
  add: (product: Product) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
  setItems: (items: CompareItem[]) => void;
  syncWithAccount: () => void | Promise<void>;
  _setHydrated: () => void;
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
    addedAt: Date.now(),
  };
}

function saveAccountCompare(userId: string, items: CompareItem[]) {
  if (typeof window === "undefined") return;
  void fetch("/api/account/compare", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }).catch(() => {
    localStorage.setItem(
      `vibe-compare-${userId}`,
      JSON.stringify({ state: { items }, version: 0 })
    );
  });
}

async function loadAccountCompareFromApi(): Promise<CompareItem[] | null> {
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const res = await fetch("/api/account/compare", {
        signal: AbortSignal.timeout(5_000),
      });
      if (res.status === 401) return null;
      if (res.status === 404 && attempt < 3) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 450 * (attempt + 1));
        });
        continue;
      }
      if (!res.ok) return null;
      const data = (await res.json()) as { items?: CompareItem[] };
      return normalizeCompareItems(data.items);
    }
    return null;
  } catch {
    return null;
  }
}

function loadAccountCompareLocal(userId: string): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`vibe-compare-${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      state?: { items?: CompareItem[] };
      items?: CompareItem[];
    };
    return normalizeCompareItems(parsed.state?.items ?? parsed.items);
  } catch {
    return [];
  }
}

async function trackCompare(
  eventType: "add" | "remove" | "clear",
  productId?: string,
  name?: string
) {
  try {
    await fetch("/api/compare/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        productId,
        metadata: name ? { name } : undefined,
      }),
    });
  } catch {
    // analytics is best-effort
  }
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      _hydrated: false,

      _setHydrated: () => set({ _hydrated: true }),

      add(product) {
        const existing = get().items;
        const check = canAddCompareItem(existing, product.id);
        if (!check.ok) return false;
        if (existing.some((item) => item.productId === product.id)) {
          return true;
        }
        const next = normalizeCompareItems([...existing, toCompareItem(product)]);
        set({ items: next });
        void trackCompare("add", product.id, product.name);
        const user = useAuthStore.getState().user;
        if (user) saveAccountCompare(user.id, next);
        return true;
      },

      remove(productId) {
        const removed = get().items.find((item) => item.productId === productId);
        const next = get().items.filter((item) => item.productId !== productId);
        set({ items: next });
        void trackCompare("remove", productId, removed?.name);
        const user = useAuthStore.getState().user;
        if (user) saveAccountCompare(user.id, next);
      },

      clear() {
        set({ items: [] });
        void trackCompare("clear");
        const user = useAuthStore.getState().user;
        if (user) saveAccountCompare(user.id, []);
      },

      has(productId) {
        return get().items.some((item) => item.productId === productId);
      },

      setItems(items) {
        set({ items: normalizeCompareItems(items) });
      },

      syncWithAccount: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const remote =
          (await loadAccountCompareFromApi()) ?? loadAccountCompareLocal(user.id);
        const merged = mergeCompareItems(get().items, remote);
        const current = get().items;
        const unchanged =
          merged.length === current.length &&
          merged.every((item, index) => item.productId === current[index]?.productId);
        if (unchanged) return;
        set({ items: merged });
        saveAccountCompare(user.id, merged);
      },
    }),
    {
      name: "vibe-compare-guest",
      storage: createSafeJSONStorage(),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
        window.setTimeout(() => void state?.syncWithAccount(), 900);
      },
    }
  )
);

useAuthStore.subscribe((authState, prevAuthState) => {
  if (authState.user?.id !== prevAuthState.user?.id) {
    useCompareStore.getState().syncWithAccount();
  }
});

export { MAX_COMPARE };
