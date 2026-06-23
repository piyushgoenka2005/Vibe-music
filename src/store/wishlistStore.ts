import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJSONStorage } from "@/lib/storage/safeLocalStorage";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import type { Product } from "@/types/product";

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  imageColor: string;
  image: string;
  addedAt: number;
}

interface WishlistState {
  items: WishlistItem[];
  drawerOpen: boolean;
  _hydrated: boolean;
  add: (product: Product) => void;
  remove: (productId: string) => void;
  toggle: (product: Product) => void;
  has: (productId: string) => boolean;
  count: () => number;
  moveToCart: (productId: string) => void;
  moveAllToCart: () => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  syncWithAccount: () => void | Promise<void>;
  _setHydrated: () => void;
}

function wishlistItemToProduct(item: WishlistItem): Product {
  return {
    id: item.productId,
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    brandSlug: item.brand.toLowerCase().replace(/\s+/g, "-"),
    category: "",
    categorySlug: "",
    price: item.price,
    rating: 0,
    reviewCount: 0,
    availability: "in-stock",
    condition: "new",
    imageColor: item.imageColor,
    image: item.image,
  };
}

function productToWishlistItem(product: Product): WishlistItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    imageColor: product.imageColor,
    image: product.image,
    addedAt: Date.now(),
  };
}

function saveAccountWishlist(userId: string, items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  void fetch("/api/account/wishlist", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  }).catch(() => {
    localStorage.setItem(
      `vibe-wishlist-${userId}`,
      JSON.stringify({ state: { items }, version: 0 })
    );
  });
}

async function loadAccountWishlistFromApi(): Promise<WishlistItem[] | null> {
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const res = await fetch("/api/account/wishlist", {
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
      const data = (await res.json()) as { items?: WishlistItem[] };
      return data.items ?? [];
    }
    return null;
  } catch {
    return null;
  }
}

function loadAccountWishlistLocal(userId: string): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`vibe-wishlist-${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      state?: { items?: WishlistItem[] };
      items?: WishlistItem[];
    };
    return parsed.state?.items ?? parsed.items ?? [];
  } catch {
    return [];
  }
}

function mergeItems(
  local: WishlistItem[],
  remote: WishlistItem[]
): WishlistItem[] {
  const map = new Map<string, WishlistItem>();
  [...remote, ...local].forEach((item) => {
    const existing = map.get(item.productId);
    if (!existing || item.addedAt > existing.addedAt) {
      map.set(item.productId, item);
    }
  });
  return Array.from(map.values()).sort((a, b) => b.addedAt - a.addedAt);
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,
      _hydrated: false,

      _setHydrated: () => set({ _hydrated: true }),

      add: (product) => {
        if (get().has(product.id)) return;
        const item = productToWishlistItem(product);
        set((state) => ({ items: [item, ...state.items] }));
        useToastStore.getState().show(`${product.name} added to wishlist`);
        const user = useAuthStore.getState().user;
        if (user) {
          saveAccountWishlist(user.id, get().items);
        }
      },

      remove: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
        if (item) {
          useToastStore.getState().show(`${item.name} removed from wishlist`, "info");
        }
        const user = useAuthStore.getState().user;
        if (user) {
          saveAccountWishlist(user.id, get().items);
        }
      },

      toggle: (product) => {
        if (get().has(product.id)) {
          get().remove(product.id);
        } else {
          get().add(product);
        }
      },

      has: (productId) =>
        get().items.some((i) => i.productId === productId),

      count: () => get().items.length,

      moveToCart: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        if (!item) return;
        useCartStore.getState().addItem(wishlistItemToProduct(item), 1);
        get().remove(productId);
        useToastStore.getState().show(`${item.name} moved to cart`);
      },

      moveAllToCart: () => {
        const items = get().items;
        items.forEach((item) => {
          useCartStore.getState().addItem(wishlistItemToProduct(item), 1);
        });
        set({ items: [], drawerOpen: false });
        useToastStore.getState().show(
          `${items.length} item${items.length === 1 ? "" : "s"} moved to cart`
        );
        const user = useAuthStore.getState().user;
        if (user) saveAccountWishlist(user.id, []);
      },

      clear: () => {
        set({ items: [] });
        useToastStore.getState().show("Wishlist cleared", "info");
        const user = useAuthStore.getState().user;
        if (user) saveAccountWishlist(user.id, []);
      },

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),

      syncWithAccount: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const remote =
          (await loadAccountWishlistFromApi()) ??
          loadAccountWishlistLocal(user.id);
        const merged = mergeItems(get().items, remote);
        const current = get().items;
        const unchanged =
          merged.length === current.length &&
          merged.every(
            (item, index) => item.productId === current[index]?.productId
          );
        if (unchanged) return;
        set({ items: merged });
        saveAccountWishlist(user.id, merged);
      },
    }),
    {
      name: "vibe-wishlist-guest",
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
    useWishlistStore.getState().syncWithAccount();
  }
});
