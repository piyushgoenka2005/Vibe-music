import "server-only";

import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import { normalizeCategorySlug } from "@/lib/categorySlug";
import type { Brand } from "@/types/brand";
import type { CatalogProduct, ProductStatus } from "@/types/catalog";
import type { Category } from "@/types/category";
import {
  brandToPrisma,
  categoryToPrisma,
  prismaToBrand,
  prismaToCategory,
  prismaToProduct,
  productToPrisma,
} from "./mappers";

function filterActive(
  products: CatalogProduct[],
  includeInactive: boolean
): CatalogProduct[] {
  if (includeInactive) return products;
  return products.filter((product) => product.status === "active");
}

function sortByName(products: CatalogProduct[]): CatalogProduct[] {
  return [...products].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Local JSON under `src/data/catalog` is a seed/dev mirror only.
 * Production must serve Postgres; enable JSON fallback explicitly via
 * ALLOW_JSON_CATALOG_FALLBACK=true (defaults on in non-production).
 */
export function isJsonCatalogFallbackAllowed(): boolean {
  const flag = process.env.ALLOW_JSON_CATALOG_FALLBACK?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  return process.env.NODE_ENV !== "production";
}

function assertPostgresForWrite(): void {
  if (!isPostgresConfigured()) {
    throw new Error("DATABASE_URL is required for catalog writes");
  }
}

/** Cached empty-DB probe so an unseeded Postgres doesn't hide the local JSON catalog. */
let emptyCatalogProbe: { checkedAt: number; empty: boolean } | null = null;
const EMPTY_CATALOG_PROBE_TTL_MS = 30_000;

export function invalidateEmptyCatalogProbe(): void {
  emptyCatalogProbe = null;
}

async function isPostgresCatalogEmpty(): Promise<boolean> {
  const now = Date.now();
  if (
    emptyCatalogProbe &&
    now - emptyCatalogProbe.checkedAt < EMPTY_CATALOG_PROBE_TTL_MS
  ) {
    return emptyCatalogProbe.empty;
  }

  try {
    const count = await prisma.product.count();
    emptyCatalogProbe = { checkedAt: now, empty: count === 0 };
    return count === 0;
  } catch {
    emptyCatalogProbe = { checkedAt: now, empty: true };
    return true;
  }
}

async function loadLocalProducts(includeInactive: boolean): Promise<CatalogProduct[]> {
  const { loadProducts } = await import("@/lib/server/catalogRepository");
  return filterActive(loadProducts(), includeInactive);
}

/** Prefer Postgres; optionally fall back to local JSON (dev / explicit opt-in). */
async function withProductFallback<T>(
  dbQuery: () => Promise<T>,
  localFallback: () => Promise<T> | T
): Promise<T> {
  const allowJson = isJsonCatalogFallbackAllowed();

  if (!isPostgresConfigured()) {
    if (!allowJson) {
      throw new Error("DATABASE_URL is required for catalog reads");
    }
    return localFallback();
  }

  if (await isPostgresCatalogEmpty()) {
    // Unseeded local DBs can use JSON; production empty DB must not hide missing seed.
    if (allowJson) return localFallback();
    return dbQuery();
  }

  try {
    return await dbQuery();
  } catch (error) {
    if (allowJson) return localFallback();
    throw error;
  }
}

export async function fetchAllProducts(
  includeInactive = false
): Promise<CatalogProduct[]> {
  return withProductFallback(
    async () => {
      const rows = await prisma.product.findMany({ orderBy: { name: "asc" } });
      return filterActive(rows.map(prismaToProduct), includeInactive);
    },
    async () => sortByName(await loadLocalProducts(includeInactive))
  );
}

export async function fetchProductById(id: string): Promise<CatalogProduct | null> {
  return withProductFallback(
    async () => {
      const row = await prisma.product.findUnique({ where: { id } });
      return row ? prismaToProduct(row) : null;
    },
    async () => {
      const { loadProducts } = await import("@/lib/server/catalogRepository");
      return loadProducts().find((product) => product.id === id) ?? null;
    }
  );
}

export async function fetchProductBySlug(
  slug: string
): Promise<CatalogProduct | null> {
  const fromLocal = async () => {
    const { loadProducts } = await import("@/lib/server/catalogRepository");
    return loadProducts().find((product) => product.slug === slug) ?? null;
  };

  return withProductFallback(async () => {
    const row = await prisma.product.findUnique({ where: { slug } });
    if (row) return prismaToProduct(row);
    // Dev/seed only: resolve curated JSON SKUs that lag DB sync.
    if (isJsonCatalogFallbackAllowed()) return fromLocal();
    return null;
  }, fromLocal);
}

export async function fetchProductsByIds(
  ids: string[],
  includeInactive = true
): Promise<CatalogProduct[]> {
  if (ids.length === 0) return [];

  return withProductFallback(
    async () => {
      const rows = await prisma.product.findMany({ where: { id: { in: ids } } });
      const byId = new Map(rows.map((row) => [row.id, prismaToProduct(row)]));
      return ids
        .map((id) => byId.get(id))
        .filter((product): product is CatalogProduct => Boolean(product))
        .filter((product) => includeInactive || product.status === "active");
    },
    async () => {
      const { loadProducts } = await import("@/lib/server/catalogRepository");
      const byId = new Map(loadProducts().map((product) => [product.id, product]));
      return ids
        .map((id) => byId.get(id))
        .filter((product): product is CatalogProduct => Boolean(product))
        .filter((product) => includeInactive || product.status === "active");
    }
  );
}

export async function fetchProductsByCategory(
  categorySlug: string,
  includeInactive = false
): Promise<CatalogProduct[]> {
  const resolved = normalizeCategorySlug(categorySlug);

  return withProductFallback(
    async () => {
      const rows = await prisma.product.findMany({
        where: { categorySlug: resolved },
        orderBy: { name: "asc" },
      });
      return filterActive(rows.map(prismaToProduct), includeInactive);
    },
    async () => {
      const { loadProducts } = await import("@/lib/server/catalogRepository");
      const products = loadProducts().filter(
        (product) =>
          product.categorySlug === resolved ||
          normalizeCategorySlug(product.category) === resolved
      );
      return filterActive(products, includeInactive);
    }
  );
}

export async function fetchProductsByBrandSlug(
  brandSlug: string,
  includeInactive = false
): Promise<CatalogProduct[]> {
  return withProductFallback(
    async () => {
      const rows = await prisma.product.findMany({
        where: { brandSlug },
        orderBy: { name: "asc" },
      });
      return filterActive(rows.map(prismaToProduct), includeInactive);
    },
    async () => {
      const { loadProducts } = await import("@/lib/server/catalogRepository");
      const products = loadProducts().filter((product) => product.brandSlug === brandSlug);
      return filterActive(products, includeInactive);
    }
  );
}

export async function fetchProductsPage(options: {
  limit?: number;
  cursor?: string;
  includeInactive?: boolean;
  status?: ProductStatus;
  categorySlug?: string;
}): Promise<{
  products: CatalogProduct[];
  hasMore: boolean;
  nextCursor?: string;
}> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const includeInactive = options.includeInactive ?? false;

  const fromLocal = async () => {
    let products = await loadLocalProducts(includeInactive);
    if (options.categorySlug) {
      const resolved = normalizeCategorySlug(options.categorySlug);
      products = products.filter(
        (product) => normalizeCategorySlug(product.category) === resolved
      );
    }
    if (options.status) {
      products = products.filter((product) => product.status === options.status);
    }
    products.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
        b.id.localeCompare(a.id)
    );
    if (options.cursor) {
      const index = products.findIndex((product) => product.id === options.cursor);
      if (index >= 0) {
        products = products.slice(index + 1);
      }
    }
    const page = products.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const items = page.slice(0, limit);
    return {
      products: items,
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : undefined,
    };
  };

  return withProductFallback(async () => {
    const where: {
      categorySlug?: string;
      status?: string;
    } = {};

    if (options.categorySlug) {
      where.categorySlug = normalizeCategorySlug(options.categorySlug);
    }
    if (options.status) {
      where.status = options.status;
    } else if (!includeInactive) {
      where.status = "active";
    }

    let products = (await prisma.product.findMany({ where })).map(prismaToProduct);
    products.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
        b.id.localeCompare(a.id)
    );

    if (options.cursor) {
      const index = products.findIndex((product) => product.id === options.cursor);
      if (index >= 0) {
        products = products.slice(index + 1);
      }
    }

    const page = products.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const items = page.slice(0, limit);

    return {
      products: items,
      hasMore,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : undefined,
    };
  }, fromLocal);
}

export async function fetchBrands(): Promise<Brand[]> {
  return withProductFallback(
    async () => {
      const rows = await prisma.brand.findMany({ orderBy: { name: "asc" } });
      return rows.map(prismaToBrand);
    },
    async () => {
      const { loadBrands } = await import("@/lib/server/catalogRepository");
      return loadBrands();
    }
  );
}

export async function fetchCategories(): Promise<Category[]> {
  return withProductFallback(
    async () => {
      const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
      return rows.map(prismaToCategory);
    },
    async () => {
      const { loadCategories } = await import("@/lib/server/catalogRepository");
      return loadCategories();
    }
  );
}

export async function fetchExistingSlugsAndSkus(): Promise<{
  slugs: Set<string>;
  skus: Set<string>;
}> {
  return withProductFallback(
    async () => {
      const rows = await prisma.product.findMany({ select: { slug: true, sku: true } });
      return {
        slugs: new Set(rows.map((row) => row.slug)),
        skus: new Set(rows.map((row) => row.sku)),
      };
    },
    async () => {
      const { loadProducts } = await import("@/lib/server/catalogRepository");
      const products = loadProducts();
      return {
        slugs: new Set(products.map((product) => product.slug)),
        skus: new Set(products.map((product) => product.sku)),
      };
    }
  );
}

export async function writeProduct(product: CatalogProduct): Promise<CatalogProduct> {
  assertPostgresForWrite();
  const row = await prisma.product.upsert({
    where: { id: product.id },
    create: productToPrisma(product),
    update: productToPrisma(product),
  });
  invalidateEmptyCatalogProbe();
  return prismaToProduct(row);
}

export async function removeProduct(id: string): Promise<void> {
  assertPostgresForWrite();
  await prisma.product.delete({ where: { id } });
}

export async function batchWriteProducts(products: CatalogProduct[]): Promise<void> {
  assertPostgresForWrite();
  await prisma.$transaction(
    products.map((product) =>
      prisma.product.upsert({
        where: { id: product.id },
        create: productToPrisma(product),
        update: productToPrisma(product),
      })
    )
  );
  invalidateEmptyCatalogProbe();
}

export async function batchWriteCategories(categories: Category[]): Promise<void> {
  assertPostgresForWrite();
  await prisma.$transaction(
    categories.map((category) =>
      prisma.category.upsert({
        where: { id: category.id },
        create: categoryToPrisma(category),
        update: categoryToPrisma(category),
      })
    )
  );
}

export async function batchWriteBrands(brands: Brand[]): Promise<void> {
  assertPostgresForWrite();
  await prisma.$transaction(
    brands.map((brand) =>
      prisma.brand.upsert({
        where: { id: brand.id },
        create: brandToPrisma(brand),
        update: brandToPrisma(brand),
      })
    )
  );
}

export async function batchUpdateProducts(
  ids: string[],
  patch: Partial<CatalogProduct>
): Promise<number> {
  assertPostgresForWrite();
  if (ids.length === 0) return 0;
  const data: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.featured !== undefined) data.featured = patch.featured;
  if (patch.trending !== undefined) data.trending = patch.trending;
  if (patch.newArrival !== undefined) data.newArrival = patch.newArrival;
  if (patch.categorySlug !== undefined) data.categorySlug = patch.categorySlug;
  if (patch.category !== undefined) data.category = patch.category;
  if (patch.stock !== undefined) {
    data.stock = patch.stock;
    data.stockQuantity = patch.stock;
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data,
  });
  return result.count;
}

export async function batchDeleteProducts(ids: string[]): Promise<number> {
  assertPostgresForWrite();
  if (ids.length === 0) return 0;
  const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  return result.count;
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  return withProductFallback(
    async () => {
      const count = await prisma.product.count({
        where: {
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      return count > 0;
    },
    async () => {
      const { loadProducts } = await import("@/lib/server/catalogRepository");
      return loadProducts().some(
        (product) => product.slug === slug && product.id !== excludeId
      );
    }
  );
}

export async function skuExists(sku: string, excludeId?: string): Promise<boolean> {
  return withProductFallback(
    async () => {
      const count = await prisma.product.count({
        where: {
          sku,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      return count > 0;
    },
    async () => {
      const { loadProducts } = await import("@/lib/server/catalogRepository");
      return loadProducts().some(
        (product) => product.sku === sku && product.id !== excludeId
      );
    }
  );
}

export { sortByName };
