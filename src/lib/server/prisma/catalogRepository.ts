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

function assertPostgresForWrite(): void {
  if (!isPostgresConfigured()) {
    throw new Error("DATABASE_URL is required for catalog writes");
  }
}

async function loadLocalProducts(includeInactive: boolean): Promise<CatalogProduct[]> {
  const { loadProducts } = await import("@/lib/server/catalogRepository");
  return filterActive(loadProducts(), includeInactive);
}

export async function fetchAllProducts(
  includeInactive = false
): Promise<CatalogProduct[]> {
  if (!isPostgresConfigured()) {
    return sortByName(await loadLocalProducts(includeInactive));
  }

  const rows = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return filterActive(rows.map(prismaToProduct), includeInactive);
}

export async function fetchProductById(id: string): Promise<CatalogProduct | null> {
  if (!isPostgresConfigured()) {
    const { loadProducts } = await import("@/lib/server/catalogRepository");
    return loadProducts().find((product) => product.id === id) ?? null;
  }

  const row = await prisma.product.findUnique({ where: { id } });
  return row ? prismaToProduct(row) : null;
}

export async function fetchProductBySlug(
  slug: string
): Promise<CatalogProduct | null> {
  if (!isPostgresConfigured()) {
    const { loadProducts } = await import("@/lib/server/catalogRepository");
    return loadProducts().find((product) => product.slug === slug) ?? null;
  }

  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? prismaToProduct(row) : null;
}

export async function fetchProductsByIds(
  ids: string[],
  includeInactive = true
): Promise<CatalogProduct[]> {
  if (ids.length === 0) return [];

  if (!isPostgresConfigured()) {
    const { loadProducts } = await import("@/lib/server/catalogRepository");
    const byId = new Map(loadProducts().map((product) => [product.id, product]));
    return ids
      .map((id) => byId.get(id))
      .filter((product): product is CatalogProduct => Boolean(product))
      .filter((product) => includeInactive || product.status === "active");
  }

  const rows = await prisma.product.findMany({ where: { id: { in: ids } } });
  const byId = new Map(rows.map((row) => [row.id, prismaToProduct(row)]));
  return ids
    .map((id) => byId.get(id))
    .filter((product): product is CatalogProduct => Boolean(product))
    .filter((product) => includeInactive || product.status === "active");
}

export async function fetchProductsByCategory(
  categorySlug: string,
  includeInactive = false
): Promise<CatalogProduct[]> {
  const resolved = normalizeCategorySlug(categorySlug);

  if (!isPostgresConfigured()) {
    const { loadProducts } = await import("@/lib/server/catalogRepository");
    const products = loadProducts().filter(
      (product) => normalizeCategorySlug(product.category) === resolved
    );
    return filterActive(products, includeInactive);
  }

  const rows = await prisma.product.findMany({
    where: { categorySlug: resolved },
    orderBy: { name: "asc" },
  });
  return filterActive(rows.map(prismaToProduct), includeInactive);
}

export async function fetchProductsByBrandSlug(
  brandSlug: string,
  includeInactive = false
): Promise<CatalogProduct[]> {
  if (!isPostgresConfigured()) {
    const { loadProducts } = await import("@/lib/server/catalogRepository");
    const products = loadProducts().filter((product) => product.brandSlug === brandSlug);
    return filterActive(products, includeInactive);
  }

  const rows = await prisma.product.findMany({
    where: { brandSlug },
    orderBy: { name: "asc" },
  });
  return filterActive(rows.map(prismaToProduct), includeInactive);
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

  if (!isPostgresConfigured()) {
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
  }

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
}

export async function fetchBrands(): Promise<Brand[]> {
  if (!isPostgresConfigured()) {
    const { loadBrands } = await import("@/lib/server/catalogRepository");
    return loadBrands();
  }

  const rows = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  return rows.map(prismaToBrand);
}

export async function fetchCategories(): Promise<Category[]> {
  if (!isPostgresConfigured()) {
    const { loadCategories } = await import("@/lib/server/catalogRepository");
    return loadCategories();
  }

  const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(prismaToCategory);
}

export async function fetchExistingSlugsAndSkus(): Promise<{
  slugs: Set<string>;
  skus: Set<string>;
}> {
  if (!isPostgresConfigured()) {
    const { loadProducts } = await import("@/lib/server/catalogRepository");
    const products = loadProducts();
    return {
      slugs: new Set(products.map((product) => product.slug)),
      skus: new Set(products.map((product) => product.sku)),
    };
  }

  const rows = await prisma.product.findMany({ select: { slug: true, sku: true } });
  return {
    slugs: new Set(rows.map((row) => row.slug)),
    skus: new Set(rows.map((row) => row.sku)),
  };
}

export async function writeProduct(product: CatalogProduct): Promise<CatalogProduct> {
  assertPostgresForWrite();
  const row = await prisma.product.upsert({
    where: { id: product.id },
    create: productToPrisma(product),
    update: productToPrisma(product),
  });
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
  if (!isPostgresConfigured()) {
    const { loadProducts } = await import("@/lib/server/catalogRepository");
    return loadProducts().some(
      (product) => product.slug === slug && product.id !== excludeId
    );
  }

  const count = await prisma.product.count({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return count > 0;
}

export async function skuExists(sku: string, excludeId?: string): Promise<boolean> {
  if (!isPostgresConfigured()) {
    const { loadProducts } = await import("@/lib/server/catalogRepository");
    return loadProducts().some(
      (product) => product.sku === sku && product.id !== excludeId
    );
  }

  const count = await prisma.product.count({
    where: {
      sku,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return count > 0;
}

export { sortByName };
