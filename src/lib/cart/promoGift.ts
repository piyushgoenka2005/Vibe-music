import { getCartLineId } from "@/lib/variants";
import type { CartGiftProductSummary } from "@/lib/cart/cartPromotions";
import type { CartItem } from "@/store/cartStore";
import { getDefaultGstRateForCategory, type GSTRate } from "@/lib/gstCalculator";

export const PROMO_GIFT_LINE_PREFIX = "promo-gift:";

export function getPromoGiftLineId(giftProductId: string): string {
  return `${PROMO_GIFT_LINE_PREFIX}${giftProductId}`;
}

export function isPromoGiftLine(item: Pick<CartItem, "lineId" | "isPromoGift">): boolean {
  return Boolean(item.isPromoGift) || item.lineId.startsWith(PROMO_GIFT_LINE_PREFIX);
}

export function computePaidSubtotal(items: CartItem[]): number {
  return items
    .filter((item) => !isPromoGiftLine(item))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function computeItemSavings(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    if (isPromoGiftLine(item)) return sum;
    const original = item.originalPrice ?? 0;
    if (original <= item.price) return sum;
    return sum + (original - item.price) * item.quantity;
  }, 0);
}

export function computeMrpTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    if (isPromoGiftLine(item)) return sum;
    const unit =
      item.originalPrice && item.originalPrice > item.price
        ? item.originalPrice
        : item.price;
    return sum + unit * item.quantity;
  }, 0);
}

export function buildPromoGiftLine(
  gift: CartGiftProductSummary,
  gstRate?: GSTRate
): CartItem {
  return {
    lineId: getPromoGiftLineId(gift.id),
    productId: gift.id,
    slug: gift.slug,
    name: gift.name,
    brand: gift.brand,
    price: 0,
    originalPrice: gift.originalPrice > 0 ? gift.originalPrice : gift.price,
    gstRate:
      gift.gstRate ??
      getDefaultGstRateForCategory(gift.categorySlug ?? "accessories"),
    imageColor: gift.imageColor,
    image: gift.image,
    quantity: 1,
    isPromoGift: true,
  };
}

export function syncPromoGiftItems(
  items: CartItem[],
  gift: CartGiftProductSummary | null,
  freeGiftThreshold: number
): CartItem[] {
  const withoutGifts = items.filter((item) => !isPromoGiftLine(item));
  const paidItems = gift
    ? withoutGifts.filter((item) => item.productId !== gift.id)
    : withoutGifts;
  const paidSubtotal = computePaidSubtotal(paidItems);

  if (!gift || paidSubtotal < freeGiftThreshold) {
    return paidItems;
  }

  const giftLine = buildPromoGiftLine(gift);
  return [giftLine, ...paidItems];
}

export function isFreeShippingUnlocked(
  paidSubtotal: number,
  freeShippingThreshold: number
): boolean {
  return paidSubtotal >= freeShippingThreshold;
}

export function isFreeGiftUnlocked(
  paidSubtotal: number,
  freeGiftThreshold: number,
  giftConfigured: boolean
): boolean {
  return giftConfigured && paidSubtotal >= freeGiftThreshold;
}

export function cartProgressRatio(
  paidSubtotal: number,
  freeGiftThreshold: number
): number {
  if (freeGiftThreshold <= 0) return 1;
  return Math.min(1, paidSubtotal / freeGiftThreshold);
}
