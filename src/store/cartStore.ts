import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useToastStore } from "@/store/toastStore";
import { getCartLineId } from "@/lib/variants";
import type { Product, ProductVariant } from "@/types/product";
import {
  DEFAULT_GST_RATE,
  getDefaultGstRateForCategory,
  type GSTRate,
} from "@/lib/gstCalculator";

export interface CartItem {
  lineId: string;
  productId: string;
  variantId?: string;
  variantSku?: string;
  variantLabel?: string;
  slug?: string;
  name: string;
  brand: string;
  price: number;
  gstRate: GSTRate;
  imageColor?: string;
  image?: string;
  quantity: number;
}

const VALID_COUPONS: Record<string, { label: string; percent: number }> = {
  SAVE10: { label: "10% off", percent: 10 },
  SWEET15: { label: "15% off", percent: 15 },
  GEAR20: { label: "20% off", percent: 20 },
};

interface CartState {
  items: CartItem[];
  drawerOpen: boolean;
  couponCode: string | null;
  couponDiscount: number;
  isApplyingCoupon: boolean;
  isUpdating: boolean;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
  discount: () => number;
  total: () => number;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  setUpdating: (value: boolean) => void;
}

function productToCartItem(
  product: Product,
  quantity: number,
  variant?: ProductVariant
): CartItem {
  const variantId = variant?.id;
  const lineId = getCartLineId(product.id, variantId);
  const image =
    variant?.images?.[0] || product.image;

  return {
    lineId,
    productId: product.id,
    variantId,
    variantSku: variant?.sku,
    variantLabel: variant?.label,
    slug: product.slug,
    name: variant?.label ? `${product.name} — ${variant.label}` : product.name,
    brand: product.brand,
    price: variant?.price ?? product.price,
    gstRate: product.gstRate ?? getDefaultGstRateForCategory(product.categorySlug),
    imageColor: product.imageColor,
    image,
    quantity,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,
      couponCode: null,
      couponDiscount: 0,
      isApplyingCoupon: false,
      isUpdating: false,

      addItem: (product, quantity = 1, variant) => {
        const qty = Math.max(1, quantity);
        const lineId = getCartLineId(product.id, variant?.id);
        set((state) => {
          const existing = state.items.find((item) => item.lineId === lineId);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.lineId === lineId
                  ? { ...item, quantity: item.quantity + qty }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              productToCartItem(product, qty, variant),
            ],
          };
        });
        useToastStore
          .getState()
          .show(`${variant?.label ?? product.name} added to cart`);
      },

      removeItem: (lineId) => {
        const item = get().items.find((i) => i.lineId === lineId);
        set((state) => ({
          items: state.items.filter((i) => i.lineId !== lineId),
        }));
        if (item) {
          useToastStore
            .getState()
            .show(`${item.name} removed from cart`, "info");
        }
      },

      updateQuantity: (lineId, quantity) => {
        const qty = Math.max(0, Math.min(99, quantity));
        if (qty === 0) {
          get().removeItem(lineId);
          return;
        }
        set({ isUpdating: true });
        set((state) => ({
          items: state.items.map((item) =>
            item.lineId === lineId ? { ...item, quantity: qty } : item
          ),
        }));
        window.setTimeout(() => set({ isUpdating: false }), 200);
      },

      clearCart: () => {
        set({ items: [], couponCode: null, couponDiscount: 0 });
        useToastStore.getState().show("Cart cleared", "info");
      },

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),

      discount: () => {
        const sub = get().subtotal();
        return Math.round(sub * (get().couponDiscount / 100) * 100) / 100;
      },

      total: () => {
        const sub = get().subtotal();
        return Math.round((sub - get().discount()) * 100) / 100;
      },

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),

      applyCoupon: async (code) => {
        const normalized = code.trim().toUpperCase();
        set({ isApplyingCoupon: true });
        await new Promise((r) => setTimeout(r, 600));
        const coupon = VALID_COUPONS[normalized];
        if (!coupon) {
          set({ isApplyingCoupon: false });
          useToastStore
            .getState()
            .show("Invalid coupon code", "error");
          return false;
        }
        set({
          couponCode: normalized,
          couponDiscount: coupon.percent,
          isApplyingCoupon: false,
        });
        useToastStore
          .getState()
          .show(`Coupon applied: ${coupon.label}`);
        return true;
      },

      removeCoupon: () => {
        set({ couponCode: null, couponDiscount: 0 });
        useToastStore.getState().show("Coupon removed", "info");
      },

      setUpdating: (value) => set({ isUpdating: value }),
    }),
    {
      name: "vibe-cart-guest",
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
      migrate: (persisted: unknown) => {
        const state = persisted as { items?: CartItem[] };
        if (!state?.items) return persisted as CartState;
        return {
          ...state,
          items: state.items.map((item) => ({
            ...item,
            lineId:
              item.lineId ??
              getCartLineId(item.productId, item.variantId),
          })),
        };
      },
      version: 2,
    }
  )
);
