import "server-only";

import { cache } from "react";
import { getCachedHomepageProducts } from "@/lib/server/catalogSnapshotCache";
import { toProduct } from "@/services/catalogService";
import type { CatalogProduct } from "@/types/catalog";
import type { Product } from "@/types/product";

const DEALS_LOAD_TIMEOUT_MS = 8_000;

function filterDealProducts(catalog: CatalogProduct[]): Product[] {
  return catalog
    .filter(
      (item) =>
        item.status === "active" &&
        (item.discountPercentage > 0 ||
          (item.originalPrice > 0 && item.originalPrice > item.price)),
    )
    .sort((a, b) => b.discountPercentage - a.discountPercentage)
    .map(toProduct);
}

export const loadDealProducts = cache(async function loadDealProducts(): Promise<Product[]> {
  try {
    const catalog = await Promise.race([
      getCachedHomepageProducts(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("DEALS_LOAD_TIMEOUT")), DEALS_LOAD_TIMEOUT_MS);
      }),
    ]);
    return filterDealProducts(catalog);
  } catch (error) {
    console.error("[deals] Failed to load deal products:", error);
    return [];
  }
});
