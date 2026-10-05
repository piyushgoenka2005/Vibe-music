import {
  buildShippingPolicyCopy,
  type ShippingPolicyCopy,
  STOREFRONT_FREE_SHIPPING_THRESHOLD,
} from "@/lib/storefront/shippingPolicy";

export interface CartShippingSettings {
  freeShippingThreshold: number;
  standardShippingCharge: number;
}

export interface CartPromotionsConfig {
  freeShippingThreshold: number;
  freeGiftThreshold: number;
  giftProductId: string | null;
  bannerText: string;
  shippingCopy: ShippingPolicyCopy;
}

export interface CartGiftProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image?: string;
  imageColor?: string;
  originalPrice: number;
  price: number;
  gstRate?: 5 | 12 | 18 | 28;
  categorySlug?: string;
}

export interface CartPromotionsPublic extends CartPromotionsConfig {
  giftProduct: CartGiftProductSummary | null;
}

function parseThreshold(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function getCartPromotionsConfig(
  shipping?: Partial<CartShippingSettings>,
): CartPromotionsConfig {
  const freeShippingThreshold =
    shipping?.freeShippingThreshold ?? STOREFRONT_FREE_SHIPPING_THRESHOLD;
  const standardShippingCharge = shipping?.standardShippingCharge ?? 0;
  const shippingCopy = buildShippingPolicyCopy({
    freeShippingThreshold,
    standardShippingCharge,
  });
  const freeGiftThreshold = parseThreshold(process.env.NEXT_PUBLIC_CART_FREE_GIFT_THRESHOLD, 799);
  const giftProductId = process.env.NEXT_PUBLIC_CART_GIFT_PRODUCT_ID?.trim() || null;

  const bannerText = giftProductId
    ? `Free gift on orders above ₹${freeGiftThreshold.toLocaleString("en-IN")}`
    : shippingCopy.cartBanner;

  return {
    freeShippingThreshold,
    freeGiftThreshold,
    giftProductId,
    bannerText,
    shippingCopy,
  };
}

export async function getCartPromotionsConfigFromStore(): Promise<CartPromotionsConfig> {
  const { getStoreSettings } = await import("@/lib/server/settingsService");
  const settings = await getStoreSettings();
  return getCartPromotionsConfig({
    freeShippingThreshold: settings.freeShippingThreshold,
    standardShippingCharge: settings.standardShippingCharge,
  });
}

export function formatCartPromoBanner(config: CartPromotionsConfig): string {
  if (config.giftProductId) {
    return `Free gift on orders above ₹${config.freeGiftThreshold.toLocaleString("en-IN")}`;
  }
  return config.shippingCopy.cartBanner;
}
