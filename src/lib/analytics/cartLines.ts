import type { CartAnalyticsLine } from "@/lib/analytics/items";
import type { CartItem } from "@/store/cartStore";

export function cartItemToAnalyticsLine(item: CartItem): CartAnalyticsLine {
  return {
    productId: item.productId,
    name: item.name,
    brand: item.brand,
    price: item.price,
    quantity: item.quantity,
    variantLabel: item.variantLabel,
    variantSku: item.variantSku,
    slug: item.slug,
  };
}

export function cartItemsToAnalyticsLines(items: CartItem[]): CartAnalyticsLine[] {
  return items
    .filter((item) => !item.isPromoGift)
    .map(cartItemToAnalyticsLine);
}
