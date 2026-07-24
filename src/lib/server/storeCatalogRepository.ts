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
  batchWriteCategories,
  batchWriteBrands,
  slugExists,
  skuExists,
} from "@/lib/server/prisma/catalogRepository";

export async function invalidateCatalogCache(): Promise<void> {
  try {
    const { revalidateCatalogSnapshot } = await import(
      "@/lib/server/catalogSnapshotCache"
    );
    await revalidateCatalogSnapshot();
  } catch (error) {
    // Never fail a catalog write/delete because cache busting threw.
    console.error("[catalog] invalidateCatalogCache failed", error);
  }
}

export async function writeProduct(product: CatalogProduct): Promise<CatalogProduct> {
  const saved = await pg.writeProduct(product);
  await invalidateCatalogCache();
  return saved;
}

export async function removeProduct(id: string): Promise<void> {
  await pg.removeProduct(id);
  await invalidateCatalogCache();
}

export async function batchWriteProducts(products: CatalogProduct[]): Promise<number> {
  await pg.batchWriteProducts(products);
  await invalidateCatalogCache();
  return products.length;
}

export async function batchDeleteProducts(ids: string[]): Promise<number> {
  const deleted = await pg.batchDeleteProducts(ids);
  await invalidateCatalogCache();
  return deleted;
}

export async function batchUpdateProducts(
  ids: string[],
  patch: Parameters<typeof pg.batchUpdateProducts>[1]
): Promise<number> {
  const updated = await pg.batchUpdateProducts(ids, patch);
  await invalidateCatalogCache();
  return updated;
}

export function isCatalogUnavailable(): boolean {
  return !process.env.DATABASE_URL?.trim();
}

export type { Brand, Category, CatalogProduct, ProductStatus };
