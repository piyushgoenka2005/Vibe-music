import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSafeJSONStorage } from "@/lib/storage/safeLocalStorage";
import { useToastStore } from "@/store/toastStore";
import { getCartLineId } from "@/lib/variants";
import {
  calculateCouponDiscountAmount,
  getCouponEligibilityError,
} from "@/lib/coupons/couponMath";
import { formatCouponLabel } from "@/lib/coupons/formatCouponLabel";
import { validateCouponCode } from "@/services/coupon.service";
import type { AppliedCouponSnapshot } from "@/types/coupon";
import type { Product, ProductVariant } from "@/types/product";
import { getDefaultGstRateForCategory, type GSTRate } from "@/lib/gstCalculator";
import { isPurchasablePrice } from "@/utils/currency";

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

interface CartState {
  items: CartItem[];
  drawerOpen: boolean;
  couponCode: string | null;
  appliedCoupon: AppliedCouponSnapshot | null;
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

function resolveCartDiscount(
  appliedCoupon: AppliedCouponSnapshot | null,
  subtotal: number
): number {
  if (!appliedCoupon || subtotal <= 0) return 0;

  const eligibilityError = getCouponEligibilityError(
    {
      isActive: true,
      usedCount: 0,
      minOrderAmount: appliedCoupon.minOrderAmount,
    },
    subtotal
  );

  if (eligibilityError) return 0;

  return calculateCouponDiscountAmount(subtotal, appliedCoupon);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,
      couponCode: null,
      appliedCoupon: null,
      isApplyingCoupon: false,
      isUpdating: false,

      addItem: (product, quantity = 1, variant) => {
        const unitPrice = variant?.price ?? product.price;
        if (!isPurchasablePrice(unitPrice)) {
          useToastStore
            .getState()
            .show("This product is Coming Soon and can’t be added yet.", "info");
          return;
        }
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
        set({ items: [], couponCode: null, appliedCoupon: null });
        useToastStore.getState().show("Cart cleared", "info");
      },

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),

      discount: () =>
        resolveCartDiscount(get().appliedCoupon, get().subtotal()),

      total: () => {
        const sub = get().subtotal();
        return Math.round((sub - get().discount()) * 100) / 100;
      },

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),

      applyCoupon: async (code) => {
        const normalized = code.trim().toUpperCase();
        if (!normalized) return false;

        const subtotal = get().subtotal();
        if (subtotal <= 0) {
          useToastStore.getState().show("Add items before applying a coupon", "error");
          return false;
        }

        set({ isApplyingCoupon: true });
        try {
          const result = await validateCouponCode(normalized, subtotal);
          if (!result.valid || !result.coupon) {
            useToastStore
              .getState()
              .show(result.error ?? "Invalid coupon code", "error");
            return false;
          }

          set({
            couponCode: result.coupon.code,
            appliedCoupon: result.coupon,
          });
          useToastStore
            .getState()
            .show(`Coupon applied: ${formatCouponLabel(result.coupon)}`);
          return true;
        } catch {
          useToastStore.getState().show("Unable to validate coupon", "error");
          return false;
        } finally {
          set({ isApplyingCoupon: false });
        }
      },

      removeCoupon: () => {
        set({ couponCode: null, appliedCoupon: null });
        useToastStore.getState().show("Coupon removed", "info");
      },

      setUpdating: (value) => set({ isUpdating: value }),
    }),
    {
      name: "vibe-cart-guest",
      storage: createSafeJSONStorage(),
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        appliedCoupon: state.appliedCoupon,
      }),
      migrate: (persisted: unknown, version) => {
        const state = persisted as {
          items?: CartItem[];
          couponCode?: string | null;
          couponDiscount?: number;
          appliedCoupon?: AppliedCouponSnapshot | null;
        };

        const base = {
          items: state?.items?.map((item) => ({
            ...item,
            lineId:
              item.lineId ?? getCartLineId(item.productId, item.variantId),
          })) ?? [],
          couponCode: state?.couponCode ?? null,
          appliedCoupon: state?.appliedCoupon ?? null,
        };

        if (version < 3) {
          return {
            ...base,
            couponCode: null,
            appliedCoupon: null,
          };
        }

        return base;
      },
      version: 3,
    }
  )
);
