/**
 * Product catalog data access (PostgreSQL via Prisma).
 * Filename kept for import stability during the Firestore removal migration.
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
  removeProduct,
  batchWriteCategories,
  batchWriteBrands,
  batchUpdateProducts,
  batchDeleteProducts,
  slugExists,
  skuExists,
} from "@/lib/server/prisma/catalogRepository";

export async function writeProduct(product: CatalogProduct): Promise<CatalogProduct> {
  const saved = await pg.writeProduct(product);
  invalidateCatalogCache();
  return saved;
}

export async function batchWriteProducts(products: CatalogProduct[]): Promise<number> {
  await pg.batchWriteProducts(products);
    invalidateCatalogCache();
  return products.length;
}

export function isCatalogUnavailable(): boolean {
  return !process.env.DATABASE_URL?.trim();
}

export function invalidateCatalogCache(): void {
  void import("@/lib/server/catalogSnapshotCache").then(({ revalidateCatalogSnapshot }) =>
    revalidateCatalogSnapshot()
  );
}

/** @deprecated Legacy Firestore helper — identity mapping for Prisma products. */
export function docToCatalogProduct(id: string, data: CatalogProduct): CatalogProduct | null {
  if (!data?.name || !data?.slug || !data?.brand) return null;
  return { ...data, id };
}

/** @deprecated Legacy Firestore helper — no-op document shape for imports. */
export function catalogProductToDoc(product: CatalogProduct): CatalogProduct {
  return {
    ...product,
    stock: product.stock,
    reservedStock: product.reservedStock ?? 0,
    lowStockThreshold: product.lowStockThreshold ?? 10,
  };
}

export type { Brand, Category, CatalogProduct, ProductStatus };
