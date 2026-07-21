import type { Ga4Item } from "@/lib/analytics/types";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

export interface CartAnalyticsLine {
  productId: string;
  name: string;
  brand?: string;
  price: number;
  quantity: number;
  variantLabel?: string;
  variantSku?: string;
  slug?: string;
}

export function productToGa4Item(
  product: Pick<
    Product,
    "id" | "name" | "brand" | "category" | "price" | "slug"
  >,
  options?: { quantity?: number; variantLabel?: string; index?: number }
): Ga4Item {
  return {
    item_id: product.id,
    item_name: product.name,
    item_brand: product.brand || undefined,
    item_category: product.category || undefined,
    item_variant: options?.variantLabel,
    price: product.price,
    quantity: options?.quantity ?? 1,
    index: options?.index,
  };
}

export function cartLineToGa4Item(
  line: CartAnalyticsLine,
  index?: number
): Ga4Item {
  return {
    item_id: line.productId,
    item_name: line.name,
    item_brand: line.brand,
    item_variant: line.variantLabel || line.variantSku,
    price: line.price,
    quantity: line.quantity,
    index,
  };
}

export function cartLinesToGa4Items(lines: CartAnalyticsLine[]): Ga4Item[] {
  return lines
    .filter((line) => !line.name.toLowerCase().includes("promo gift"))
    .map((line, index) => cartLineToGa4Item(line, index));
}

export function orderToGa4Items(order: Order): Ga4Item[] {
  return order.items.map((item, index) => ({
    item_id: item.productId,
    item_name: item.name,
    item_variant: item.variantLabel || item.variantSku,
    price: item.price,
    quantity: item.quantity,
    index,
  }));
}

export function sumLineValue(lines: CartAnalyticsLine[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}
