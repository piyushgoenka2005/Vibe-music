/**
 * Product catalog data access (PostgreSQL via Prisma).
 */
import "server-only";

import type { CatalogProduct, ProductStatus } from "@/types/catalog";
import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import * as pg from "@/lib/server/prisma/catalogRepository";

export {
  fetchAllProducts,
  fetchProductById,
  fetchProductBySlug,
  fetchProductsByIds,
  fetchProductsByCategory,
  fetchProductsByBrandSlug,
  fetchProductsPage,
  fetchBrands,
  fetchCategories,
  fetchExistingSlugsAndSkus,
  fetchProductSkuIndex,
  batchWriteCategories,
  batchWriteBrands,
  slugExists,
  skuExists,
} from "@/lib/server/prisma/catalogRepository";

let inFlightCatalogInvalidate: Promise<void> | null = null;
let lastCatalogInvalidateTime = 0;
const CATALOG_INVALIDATE_COOLDOWN_MS = 1000;

export async function invalidateCatalogCache(): Promise<void> {
  if (inFlightCatalogInvalidate) {
    return inFlightCatalogInvalidate;
  }
  const now = Date.now();
  if (now - lastCatalogInvalidateTime < CATALOG_INVALIDATE_COOLDOWN_MS) {
    return;
  }

  inFlightCatalogInvalidate = (async () => {
    try {
      const [
        { revalidateCatalogSnapshot },
        { revalidateHomepageSnapshot },
        { invalidateCacheByPrefix },
      ] = await Promise.all([
        import("@/lib/server/catalogSnapshotCache"),
        import("@/lib/server/homepageSnapshotCache"),
        import("@/lib/server/redisCache"),
      ]);

      await Promise.all([
        revalidateCatalogSnapshot(),
        revalidateHomepageSnapshot(),
        invalidateCacheByPrefix("products"),
      ]);
    } catch (error) {
      // Never fail a catalog write/delete because cache busting threw.
      console.error("[catalog] invalidateCatalogCache failed", error);
    }
  })().finally(() => {
    inFlightCatalogInvalidate = null;
    lastCatalogInvalidateTime = Date.now();
  });

  return inFlightCatalogInvalidate;
}

export async function writeProduct(
  product: CatalogProduct,
  options?: { skipCacheInvalidation?: boolean },
): Promise<CatalogProduct> {
  const saved = await pg.writeProduct(product);
  if (!options?.skipCacheInvalidation) {
    await invalidateCatalogCache();
  }
  return saved;
}

export async function removeProduct(id: string): Promise<void> {
  await pg.removeProduct(id);
  await invalidateCatalogCache();
}

export async function batchWriteProducts(
  products: CatalogProduct[],
  options?: { skipCacheInvalidation?: boolean },
): Promise<number> {
  await pg.batchWriteProducts(products);
  if (!options?.skipCacheInvalidation) {
    await invalidateCatalogCache();
  }
  return products.length;
}

export async function batchDeleteProducts(ids: string[]): Promise<number> {
  const deleted = await pg.batchDeleteProducts(ids);
  await invalidateCatalogCache();
  return deleted;
}

export async function batchUpdateProducts(
  ids: string[],
  patch: Parameters<typeof pg.batchUpdateProducts>[1],
): Promise<number> {
  const updated = await pg.batchUpdateProducts(ids, patch);
  await invalidateCatalogCache();
  return updated;
}

export async function batchUpdateProductSubcategories(
  updates: Array<{ id: string; subcategory: string }>,
): Promise<number> {
  if (updates.length === 0) return 0;
  await pg.batchUpdateProductSubcategories(updates);
  await invalidateCatalogCache();
  return updates.length;
}

export function isCatalogUnavailable(): boolean {
  return !process.env.DATABASE_URL?.trim();
}

export type { Brand, Category, CatalogProduct, ProductStatus };
