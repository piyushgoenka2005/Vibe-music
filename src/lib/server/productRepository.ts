import {
  searchProducts as catalogSearchProducts,
  searchInCatalogProducts,
  type ProductSearchOptions,
} from "@/services/catalogService";
import type { Product } from "@/types/product";

export type { ProductSearchOptions };

const SEARCH_TIMEOUT_MS = 2_500;

async function searchFromLocalCatalog(
  options: ProductSearchOptions
): Promise<Product[]> {
  const { loadProducts } = await import("@/lib/server/catalogRepository");
  const includeInactive = options.includeInactive ?? false;
  const products = loadProducts().filter(
    (product) => includeInactive || product.status === "active"
  );
  return searchInCatalogProducts(products, options);
}

export async function listProducts(): Promise<Product[]> {
  return catalogSearchProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { getProductBySlug: getBySlug } = await import(
    "@/services/catalogService"
  );
  return (await getBySlug(slug)) ?? null;
}

async function trendingFromLocalCatalog(): Promise<Product[]> {
  const { loadProducts } = await import("@/lib/server/catalogRepository");
  const { toProduct } = await import("@/services/catalogService");
  return loadProducts()
    .filter((product) => product.status === "active" && product.trending)
    .map(toProduct);
}

export async function getTrendingProducts(): Promise<Product[]> {
  const { getTrendingProducts: getTrending } = await import(
    "@/services/catalogService"
  );

  try {
    return await Promise.race([
      getTrending(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("TRENDING_TIMEOUT")), SEARCH_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return trendingFromLocalCatalog();
  }
}

export async function searchProducts(
  options: ProductSearchOptions = {}
): Promise<Product[]> {
  try {
    return await Promise.race([
      catalogSearchProducts(options),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("SEARCH_TIMEOUT")), SEARCH_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return searchFromLocalCatalog(options);
  }
}
