export interface CartPromotionsConfig {
  freeShippingThreshold: number;
  freeGiftThreshold: number;
  giftProductId: string | null;
  bannerText: string;
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

export function getCartPromotionsConfig(): CartPromotionsConfig {
  const freeShippingThreshold = parseThreshold(
    process.env.NEXT_PUBLIC_CART_FREE_SHIPPING_THRESHOLD,
    400
  );
  const freeGiftThreshold = parseThreshold(
    process.env.NEXT_PUBLIC_CART_FREE_GIFT_THRESHOLD,
    799
  );
  const giftProductId =
    process.env.NEXT_PUBLIC_CART_GIFT_PRODUCT_ID?.trim() || null;

  const bannerText = giftProductId
    ? `Free gift on orders above ₹${freeGiftThreshold.toLocaleString("en-IN")}`
    : `Free shipping on orders above ₹${freeShippingThreshold.toLocaleString("en-IN")}`;

  return {
    freeShippingThreshold,
    freeGiftThreshold,
    giftProductId,
    bannerText,
  };
}

export function formatCartPromoBanner(config: CartPromotionsConfig): string {
  if (config.giftProductId) {
    return `Free gift on orders above ₹${config.freeGiftThreshold.toLocaleString("en-IN")}`;
  }
  return `Free shipping on orders above ₹${config.freeShippingThreshold.toLocaleString("en-IN")}`;
}
