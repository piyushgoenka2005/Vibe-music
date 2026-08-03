import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDefaultGstRateForCategory, type GSTRate } from "@/lib/gstCalculator";
import { resolvePositiveUnitPrice } from "@/lib/pricing/unitPrice";
import { createSafeSessionJSONStorage } from "@/lib/storage/safeLocalStorage";
import { getCartLineId } from "@/lib/variants";
import type { CartItem } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import type { Product, ProductVariant } from "@/types/product";
import { isPurchasablePrice } from "@/utils/currency";

export type CheckoutMode = "cart" | "buyNow";

const CHECKOUT_MODE_KEY = "vibe-last-checkout-mode";

function resolveProductOriginalPrice(
  product: Product,
  unitPrice: number
): number | undefined {
  const original = product.originalPrice;
  if (original != null && original > unitPrice) return original;
  return undefined;
}

function productToBuyNowItem(
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
    originalPrice: resolveProductOriginalPrice(product, price),
    gstRate:
      (product.gstRate as GSTRate | undefined) ??
      getDefaultGstRateForCategory(product.categorySlug),
    imageColor: product.imageColor,
    image,
    quantity,
  };
}

interface BuyNowState {
  item: CartItem | null;
  startBuyNow: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant
  ) => boolean;
  clearBuyNow: () => void;
  getItems: () => CartItem[];
}

export const useBuyNowStore = create<BuyNowState>()(
  persist(
    (set, get) => ({
      item: null,

      startBuyNow: (product, quantity = 1, variant) => {
        const unitPrice = resolvePositiveUnitPrice(product.price, variant?.price);
        if (unitPrice == null || !isPurchasablePrice(unitPrice)) {
          useToastStore
            .getState()
            .show("This product is Coming Soon and can’t be purchased yet.", "info");
          return false;
        }

        const maxStock =
          variant?.stock != null && variant.stock > 0
            ? Math.min(99, variant.stock)
            : 99;
        const qty = Math.min(Math.max(1, quantity), maxStock);
        const item = productToBuyNowItem(product, qty, variant);
        set({ item });
        setLastCheckoutMode("buyNow");
        return true;
      },

      clearBuyNow: () => {
        set({ item: null });
      },

      getItems: () => {
        const item = get().item;
        return item ? [item] : [];
      },
    }),
    {
      name: "vibe-buy-now",
      storage: createSafeSessionJSONStorage(),
      partialize: (state) => ({ item: state.item }),
      version: 1,
    }
  )
);

export function setLastCheckoutMode(mode: CheckoutMode): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHECKOUT_MODE_KEY, mode);
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function readLastCheckoutMode(): CheckoutMode {
  if (typeof window === "undefined") return "cart";
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_MODE_KEY);
    return raw === "buyNow" ? "buyNow" : "cart";
  } catch {
    return "cart";
  }
}

export function clearLastCheckoutMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CHECKOUT_MODE_KEY);
  } catch {
    // Ignore.
  }
}

/** Checkout path for Amazon-style Buy Now (single-item session). */
export const BUY_NOW_CHECKOUT_HREF = "/checkout?buyNow=1";

export function isBuyNowCheckoutSearchParam(
  value: string | null | undefined
): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}
