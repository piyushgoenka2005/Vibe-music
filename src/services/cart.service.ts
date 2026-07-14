import type { CartItem } from "@/store/cartStore";
import type { GSTRate } from "@/lib/gstCalculator";

export interface RepricedCartLine {
  productId: string;
  variantId?: string;
  variantSku?: string;
  variantLabel?: string;
  name: string;
  quantity: number;
  price: number;
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
  items: Array<Pick<CartItem, "productId" | "variantId" | "quantity" | "name">>
): Promise<RepriceResponse> {
  const response = await fetch("/api/cart/reprice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map((item) => ({
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
