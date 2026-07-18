import type { CartItem } from "@/store/cartStore";
import type { CartPromotionsPublic } from "@/lib/cart/cartPromotions";
import type { GSTRate } from "@/lib/gstCalculator";
import { isPromoGiftLine } from "@/lib/cart/promoGift";

export interface RepricedCartLine {
  productId: string;
  variantId?: string;
  variantSku?: string;
  variantLabel?: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  gstRate: GSTRate;
  image?: string;
  brand?: string;
  slug?: string;
  error?: string;
}

interface RepriceResponse {
  items: RepricedCartLine[];
  subtotal: number;
  error?: string;
}

export async function fetchCartReprice(
  items: Array<Pick<CartItem, "productId" | "variantId" | "quantity" | "name" | "lineId" | "isPromoGift">>
): Promise<RepriceResponse> {
  const pricedItems = items.filter((item) => !isPromoGiftLine(item));
  if (pricedItems.length === 0) {
    return { items: [], subtotal: 0 };
  }

  const response = await fetch("/api/cart/reprice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: pricedItems.map((item) => ({
        productId: item.productId,
        ...(item.variantId ? { variantId: item.variantId } : {}),
        quantity: item.quantity,
        ...(item.name ? { name: item.name } : {}),
      })),
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as RepriceResponse | null;
    throw new Error(body?.error ?? "Unable to refresh cart prices");
  }

  return (await response.json()) as RepriceResponse;
}

export async function fetchCartPromotions(): Promise<CartPromotionsPublic> {
  const response = await fetch("/api/cart/promotions");
  if (!response.ok) {
    throw new Error("Unable to load cart promotions");
  }
  return (await response.json()) as CartPromotionsPublic;
}
