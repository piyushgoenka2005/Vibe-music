import "server-only";

import {
  getTrendingProducts,
  searchProducts,
} from "@/lib/server/productRepository";
import { getFeaturedProducts } from "@/services/catalogService";
import type { Product } from "@/types/product";

export const FOOTER_TRENDING_LIMIT = 4;
const FOOTER_TRENDING_POOL = 32;

export function hasStorefrontPrice(product: Product): boolean {
  return Number.isFinite(product.price) && product.price > 0;
}

function dedupePricedProducts(lists: Product[][]): Product[] {
  const seen = new Set<string>();
  const result: Product[] = [];

  for (const list of lists) {
    for (const product of list) {
      if (!hasStorefrontPrice(product) || seen.has(product.id)) continue;
      seen.add(product.id);
      result.push(product);
      if (result.length >= FOOTER_TRENDING_LIMIT) return result;
    }
  }

  return result;
}

export async function getFooterTrendingProducts(
  limit = FOOTER_TRENDING_LIMIT
): Promise<Product[]> {
  const [trending, featured, popular, recent] = await Promise.all([
    getTrendingProducts(),
    getFeaturedProducts(),
    searchProducts({ sort: "reviews-desc", limit: FOOTER_TRENDING_POOL }),
    searchProducts({ limit: FOOTER_TRENDING_POOL }),
  ]);

  const picked = dedupePricedProducts([trending, featured, popular, recent]);
  return picked.slice(0, limit);
}
