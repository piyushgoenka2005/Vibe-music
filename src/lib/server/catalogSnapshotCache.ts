import "server-only";

import { unstable_cache } from "next/cache";
import { fetchAllProducts as fetchAllProductsFromDb } from "@/lib/server/firestoreCatalogRepository";
import type { CatalogProduct } from "@/types/catalog";

const CATALOG_REVALIDATE_SECONDS =
  Number(process.env.CATALOG_CACHE_REVALIDATE_SECONDS) || 60;

async function loadActiveProducts(): Promise<CatalogProduct[]> {
  return fetchAllProductsFromDb(false);
}

async function loadAllProducts(): Promise<CatalogProduct[]> {
  return fetchAllProductsFromDb(true);
}

export const getCachedActiveProducts = unstable_cache(
  loadActiveProducts,
  ["catalog-active-products"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["catalog"] }
);

export const getCachedAllProducts = unstable_cache(
  loadAllProducts,
  ["catalog-all-products"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["catalog"] }
);

const CATEGORY_REVALIDATE_SECONDS =
  Number(process.env.CATEGORY_CACHE_REVALIDATE_SECONDS) ||
  CATALOG_REVALIDATE_SECONDS;

async function loadCategories() {
  const { fetchCategories } = await import(
    "@/lib/server/firestoreCatalogRepository"
  );
  return fetchCategories();
}

export const getCachedCategories = unstable_cache(
  loadCategories,
  ["catalog-categories"],
  { revalidate: CATEGORY_REVALIDATE_SECONDS, tags: ["catalog", "categories"] }
);

export async function getCachedProducts(
  includeInactive = false
): Promise<CatalogProduct[]> {
  return includeInactive ? getCachedAllProducts() : getCachedActiveProducts();
}

export async function revalidateCatalogSnapshot(): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("catalog", "max");
  revalidateTag("categories", "max");
}
