import "server-only";

import { unstable_cache } from "next/cache";
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

function dedupePricedProducts(
  lists: Product[][],
  options?: { inStockOnly?: boolean }
): Product[] {
  const seen = new Set<string>();
  const result: Product[] = [];
  const inStockOnly = options?.inStockOnly ?? false;

  for (const list of lists) {
    for (const product of list) {
      if (!hasStorefrontPrice(product) || seen.has(product.id)) continue;
      if (inStockOnly && product.availability === "out-of-stock") {
        continue;
      }
      seen.add(product.id);
      result.push(product);
      if (result.length >= FOOTER_TRENDING_LIMIT) return result;
    }
  }

  return result;
}

async function loadFooterTrendingProducts(
  limit = FOOTER_TRENDING_LIMIT
): Promise<Product[]> {
  const [trending, featured, popular, recent] = await Promise.all([
    getTrendingProducts(),
    getFeaturedProducts(),
    searchProducts({ sort: "reviews-desc", limit: FOOTER_TRENDING_POOL }),
    searchProducts({ limit: FOOTER_TRENDING_POOL }),
  ]);

  const pools = [trending, featured, popular, recent];
  const inStock = dedupePricedProducts(pools, { inStockOnly: true });
  const picked =
    inStock.length > 0 ? inStock : dedupePricedProducts(pools);
  return picked.slice(0, limit);
}

const getCachedFooterTrendingProducts = unstable_cache(
  async (limit: number) => loadFooterTrendingProducts(limit),
  ["footer-trending-products"],
  { revalidate: 60 }
);

export async function getFooterTrendingProducts(
  limit = FOOTER_TRENDING_LIMIT
): Promise<Product[]> {
  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.min(limit, 12) : FOOTER_TRENDING_LIMIT;
  return getCachedFooterTrendingProducts(safeLimit);
}
