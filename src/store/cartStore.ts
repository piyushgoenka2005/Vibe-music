import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartGiftProductSummary, CartPromotionsPublic } from "@/lib/cart/cartPromotions";
import {
  computeItemSavings,
  computePaidSubtotal,
  isPromoGiftLine,
  syncPromoGiftItems,
} from "@/lib/cart/promoGift";
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
import { resolvePositiveUnitPrice } from "@/lib/pricing/unitPrice";
import { isPurchasablePrice } from "@/utils/currency";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics/events";
import { cartItemToAnalyticsLine } from "@/lib/analytics/cartLines";

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
  originalPrice?: number;
  gstRate: GSTRate;
  imageColor?: string;
  image?: string;
  quantity: number;
  isPromoGift?: boolean;
}

export interface CatalogPriceUpdate {
  productId: string;
  variantId?: string;
  price: number;
  originalPrice?: number;
  name?: string;
  gstRate?: GSTRate;
  variantSku?: string;
  variantLabel?: string;
  image?: string;
  brand?: string;
  slug?: string;
}

interface CartState {
  items: CartItem[];
  drawerOpen: boolean;
  couponCode: string | null;
  appliedCoupon: AppliedCouponSnapshot | null;
  isApplyingCoupon: boolean;
  isUpdating: boolean;
  promoConfig: CartPromotionsPublic | null;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  applyCatalogPrices: (updates: CatalogPriceUpdate[]) => void;
  itemCount: () => number;
  subtotal: () => number;
  paidSubtotal: () => number;
  itemSavings: () => number;
  totalSavings: () => number;
  discount: () => number;
  total: () => number;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  setUpdating: (value: boolean) => void;
  setPromoConfig: (config: CartPromotionsPublic | null) => void;
  syncPromoRewards: () => void;
}

function resolveProductOriginalPrice(
  product: Product,
  unitPrice: number,
  variant?: ProductVariant
): number | undefined {
  const variantPrice = variant?.price;
  void variantPrice;
  const original = product.originalPrice;
  if (original != null && original > unitPrice) return original;
  return undefined;
}

function productToCartItem(
  product: Product,
  quantity: number,
  variant?: ProductVariant
): CartItem {
  const variantId = variant?.id;
  const lineId = getCartLineId(product.id, variantId);
  const image = variant?.images?.[0] || product.image;
  const price = resolvePositiveUnitPrice(product.price, variant?.price) ?? 0;

  return {
    lineId,
    productId: product.id,
    variantId,
    variantSku: variant?.sku,
    variantLabel: variant?.label,
    slug: product.slug,
    name: variant?.label ? `${product.name} — ${variant.label}` : product.name,
    brand: product.brand,
    price,
    originalPrice: resolveProductOriginalPrice(product, price, variant),
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

function applyPromoSync(
  items: CartItem[],
  promoConfig: CartPromotionsPublic | null
): CartItem[] {
  const gift = promoConfig?.giftProduct ?? null;
  const threshold = promoConfig?.freeGiftThreshold ?? 799;
  return syncPromoGiftItems(items, gift, threshold);
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
      promoConfig: null,

      addItem: (product, quantity = 1, variant) => {
        const unitPrice = resolvePositiveUnitPrice(product.price, variant?.price);
        if (unitPrice == null || !isPurchasablePrice(unitPrice)) {
          useToastStore
            .getState()
            .show("This product is Coming Soon and can’t be added yet.", "info");
          return;
        }
        const qty = Math.max(1, quantity);
        const lineId = getCartLineId(product.id, variant?.id);
        const fresh = productToCartItem(product, qty, variant);
        set((state) => {
          const existing = state.items.find(
            (item) => item.lineId === lineId && !isPromoGiftLine(item)
          );
          let items: CartItem[];
          if (existing) {
            items = state.items.map((item) =>
              item.lineId === lineId
                ? {
                    ...item,
                    ...fresh,
                    quantity: item.quantity + qty,
                    lineId: item.lineId,
                    isPromoGift: undefined,
                  }
                : item
            );
          } else {
            items = [...state.items, fresh];
          }
          return { items: applyPromoSync(items, state.promoConfig) };
        });
        useToastStore
          .getState()
          .show(`${variant?.label ?? product.name} added to cart`);
        trackAddToCart(product, qty, variant?.label);
      },

      removeItem: (lineId) => {
        const item = get().items.find((i) => i.lineId === lineId);
        if (item && isPromoGiftLine(item)) return;

        set((state) => {
          const items = applyPromoSync(
            state.items.filter((i) => i.lineId !== lineId),
            state.promoConfig
          );
          return { items };
        });
        if (item) {
          useToastStore
            .getState()
            .show(`${item.name} removed from cart`, "info");
          trackRemoveFromCart(cartItemToAnalyticsLine(item));
        }
      },

      updateQuantity: (lineId, quantity) => {
        if (get().isUpdating) return;

        const item = get().items.find((i) => i.lineId === lineId);
        if (item && isPromoGiftLine(item)) return;

        const qty = Math.max(0, Math.min(99, quantity));
        if (qty === 0) {
          get().removeItem(lineId);
          return;
        }
        set({ isUpdating: true });
        set((state) => {
          const items = applyPromoSync(
            state.items.map((entry) =>
              entry.lineId === lineId ? { ...entry, quantity: qty } : entry
            ),
            state.promoConfig
          );
          return { items };
        });
        window.setTimeout(() => set({ isUpdating: false }), 200);
      },

      clearCart: () => {
        set({ items: [], couponCode: null, appliedCoupon: null });
        useToastStore.getState().show("Cart cleared", "info");
      },

      applyCatalogPrices: (updates) => {
        if (updates.length === 0) return;

        const byLine = new Map(
          updates.map((update) => [
            getCartLineId(update.productId, update.variantId),
            update,
          ])
        );

        set((state) => {
          let changed = false;
          const items = state.items.map((item) => {
            if (isPromoGiftLine(item)) return item;

            const update = byLine.get(item.lineId);
            if (!update || !isPurchasablePrice(update.price)) return item;

            const next = {
              ...item,
              price: update.price,
              ...(update.originalPrice != null
                ? { originalPrice: update.originalPrice }
                : {}),
              ...(update.name ? { name: update.name } : {}),
              ...(update.gstRate ? { gstRate: update.gstRate } : {}),
              ...(update.variantSku ? { variantSku: update.variantSku } : {}),
              ...(update.variantLabel
                ? { variantLabel: update.variantLabel }
                : {}),
              ...(update.image ? { image: update.image } : {}),
              ...(update.brand ? { brand: update.brand } : {}),
              ...(update.slug ? { slug: update.slug } : {}),
            };

            if (
              next.price !== item.price ||
              next.originalPrice !== item.originalPrice ||
              next.name !== item.name ||
              next.gstRate !== item.gstRate
            ) {
              changed = true;
            }
            return next;
          });

          if (!changed) return state;
          return { items: applyPromoSync(items, state.promoConfig) };
        });
      },

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),

      paidSubtotal: () => computePaidSubtotal(get().items),

      itemSavings: () => computeItemSavings(get().items),

      totalSavings: () => get().itemSavings() + get().discount(),

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

      setPromoConfig: (config) => {
        set((state) => ({
          promoConfig: config,
          items: applyPromoSync(state.items, config),
        }));
      },

      syncPromoRewards: () => {
        set((state) => ({
          items: applyPromoSync(state.items, state.promoConfig),
        }));
      },
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
          items:
            state?.items?.map((item) => ({
              ...item,
              lineId:
                item.lineId ?? getCartLineId(item.productId, item.variantId),
              price: isPurchasablePrice(item.price) ? item.price : 0,
              isPromoGift: item.isPromoGift ?? item.lineId?.startsWith("promo-gift:"),
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
      version: 5,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.items = state.items.filter(
          (item) => !item.lineId?.startsWith("promo-gift:")
        );
      },
    }
  )
);

export type { CartGiftProductSummary, CartPromotionsPublic };
