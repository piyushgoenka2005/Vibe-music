import {
  bulkActivateProducts,
  bulkArchiveProducts,
  bulkDeleteProducts,
  bulkUpdateCategory,
  bulkUpdateStock,
  createProduct,
  deleteProduct,
  getProductById,
  toProduct,
  toProductDetail,
  updateProduct,
} from "@/services/catalogService";
import { fetchAllProducts } from "@/lib/server/storeCatalogRepository";
import {
  notifyWaitlistOnGoLive,
  notifyWaitlistOnRestock,
} from "@/lib/server/restockNotificationService";
import { getProductImage } from "@/data/productImages";
import { VIBEMUSIC_BULK_HEADERS, catalogProductToBulkRow } from "@/lib/amazonListingImport";
import { rowsToCsv, type ParsedCsvRow } from "@/lib/csv";
import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import type { AdminProduct } from "@/types/admin";
import type { CatalogProduct, CreateProductInput } from "@/types/catalog";
import type { ProductSpec, ProductVideo } from "@/types/product";
import { paginateSortedById } from "@/lib/admin/paginateByCursor";
import { prismaToProduct } from "@/lib/server/prisma/mappers";
import type { Prisma } from "@prisma/client";

async function purgeProductSideData(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;

  const reviewIds = (
    await prisma.review.findMany({
      where: { productId: { in: productIds } },
      select: { id: true },
    })
  ).map((row) => row.id);

  if (reviewIds.length > 0) {
    await prisma.reviewVote.deleteMany({ where: { reviewId: { in: reviewIds } } });
    await prisma.review.deleteMany({ where: { id: { in: reviewIds } } });
  }

  await prisma.$transaction([
    prisma.productBundle.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.productRelation.deleteMany({
      where: { productId: { in: productIds } },
    }),
    prisma.productReviewStats.deleteMany({
      where: { productId: { in: productIds } },
    }),
    prisma.productQuestion.deleteMany({
      where: { productId: { in: productIds } },
    }),
    prisma.productStockAlert.deleteMany({
      where: { productId: { in: productIds } },
    }),
    prisma.inventoryLog.deleteMany({
      where: { productId: { in: productIds } },
    }),
    prisma.userProductReview.deleteMany({
      where: { productId: { in: productIds } },
    }),
    prisma.homepageSectionItem.deleteMany({
      where: { productId: { in: productIds } },
    }),
  ]);
}

function toAdminProduct(catalog: CatalogProduct): AdminProduct {
  const product = toProduct(catalog);
  const detail = toProductDetail(catalog);
  return {
    ...product,
    sku: catalog.sku,
    status: catalog.status,
    originalPrice: catalog.originalPrice,
    salePrice: catalog.originalPrice > catalog.price ? catalog.price : null,
    stockQuantity: catalog.stock,
    lowStockThreshold: catalog.lowStockThreshold ?? 10,
    description: catalog.description,
    featured: catalog.featured,
    trending: catalog.trending,
    newArrival: catalog.newArrival,
    createdAt: catalog.createdAt,
    updatedAt: catalog.updatedAt,
    variants: detail.variants,
    specifications: catalog.specifications,
    images: catalog.images,
    spin360Images: catalog.detail?.spin360Images ?? [],
    inTheBox: detail.inTheBox,
    videos: detail.videos,
    detailSpecs: detail.specs,
  };
}

export async function listAdminProducts(
  options: {
    search?: string;
    status?: string;
    category?: string;
    stock?: "in" | "low" | "out";
    limit?: number;
    offset?: number;
    cursor?: string;
  } = {},
): Promise<{
  products: AdminProduct[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);

  if (isPostgresConfigured()) {
    return listAdminProductsFromDb({ ...options, limit });
  }

  return listAdminProductsInMemory({ ...options, limit });
}

async function listAdminProductsFromDb(options: {
  search?: string;
  status?: string;
  category?: string;
  stock?: "in" | "low" | "out";
  limit: number;
  offset?: number;
  cursor?: string;
}): Promise<{
  products: AdminProduct[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}> {
  const where: Prisma.ProductWhereInput = {};

  if (options.status) {
    where.status = options.status;
  }

  if (options.category) {
    where.OR = [{ categorySlug: options.category }, { category: options.category }];
  }

  if (options.search?.trim()) {
    const q = options.search.trim();
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (options.stock === "out") {
    where.stock = { lte: 0 };
  } else if (options.stock === "in") {
    // "In stock" above typical low threshold; exact threshold is per-row so use stock > 10.
    where.stock = { gt: 10 };
  } else if (options.stock === "low") {
    where.stock = { gt: 0, lte: 10 };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ createdAt: "desc" }, { id: "desc" }];

  let cursorSkip = 0;
  if (options.cursor) {
    const cursorRow = await prisma.product.findUnique({
      where: { id: options.cursor },
      select: { id: true, createdAt: true },
    });
    if (cursorRow) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { createdAt: { lt: cursorRow.createdAt } },
            { createdAt: cursorRow.createdAt, id: { lt: cursorRow.id } },
          ],
        },
      ];
    }
  } else if (options.offset && options.offset > 0) {
    cursorSkip = options.offset;
  }

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      take: options.limit + 1,
      skip: cursorSkip,
    }),
  ]);

  const hasMore = rows.length > options.limit;
  const page = rows.slice(0, options.limit).map((row) => toAdminProduct(prismaToProduct(row)));

  return {
    products: page,
    total,
    hasMore,
    nextCursor: hasMore ? page[page.length - 1]?.id : undefined,
  };
}

async function listAdminProductsInMemory(options: {
  search?: string;
  status?: string;
  category?: string;
  stock?: "in" | "low" | "out";
  limit: number;
  offset?: number;
  cursor?: string;
}): Promise<{
  products: AdminProduct[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}> {
  let products = (await fetchAllProducts(true)).map(toAdminProduct);

  if (options.search) {
    const q = options.search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false),
    );
  }

  if (options.status) {
    products = products.filter((p) => p.status === options.status);
  }

  if (options.category) {
    products = products.filter(
      (p) => p.categorySlug === options.category || p.category === options.category,
    );
  }

  if (options.stock) {
    products = products.filter((p) => {
      const qty = p.stockQuantity ?? 0;
      const threshold = p.lowStockThreshold ?? 10;
      if (options.stock === "out") return qty <= 0;
      if (options.stock === "low") return qty > 0 && qty <= threshold;
      return qty > threshold;
    });
  }

  products.sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );

  const total = products.length;

  if (options.cursor) {
    const page = paginateSortedById(products, {
      limit: options.limit,
      cursor: options.cursor,
    });
    return {
      products: page.items,
      total,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    };
  }

  const offset = options.offset ?? 0;
  products = products.slice(offset, offset + options.limit);
  const hasMore = offset + options.limit < total;

  return {
    products,
    total,
    hasMore,
    nextCursor: hasMore ? products[products.length - 1]?.id : undefined,
  };
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const product = await getProductById(id);
  return product ? toAdminProduct(product) : null;
}

/** All matching admin products (no pagination) for CSV export. */
export async function listAdminProductsForExport(
  options: {
    search?: string;
    status?: string;
    category?: string;
  } = {},
): Promise<AdminProduct[]> {
  const result = await listAdminProducts({
    ...options,
    limit: Number.MAX_SAFE_INTEGER,
    offset: 0,
  });
  return result.products;
}

function filterCatalogForExport(
  products: CatalogProduct[],
  options: { search?: string; status?: string; category?: string },
): CatalogProduct[] {
  let filtered = products;

  if (options.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }

  if (options.status) {
    filtered = filtered.filter((p) => p.status === options.status);
  }

  if (options.category) {
    filtered = filtered.filter(
      (p) => p.categorySlug === options.category || p.category === options.category,
    );
  }

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * CSV in the vibemusic bulk template format so exports re-import cleanly.
 */
export async function buildAdminProductsExportCsv(
  options: {
    search?: string;
    status?: string;
    category?: string;
  } = {},
): Promise<string> {
  const products = filterCatalogForExport(await fetchAllProducts(true), options);
  const headers = [...VIBEMUSIC_BULK_HEADERS];

  const rows: ParsedCsvRow[] = products.map((product) => {
    const bulk = catalogProductToBulkRow({
      name: product.name,
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      originalPrice: product.originalPrice,
      sku: product.sku,
      description: product.description,
      specifications: product.specifications,
      inTheBox: Array.isArray(product.detail?.inTheBox) ? product.detail.inTheBox : [],
    });
    const row: ParsedCsvRow = {};
    for (const header of headers) {
      row[header] = bulk[header] ?? "";
    }
    return row;
  });

  return rowsToCsv(headers, rows);
}

export async function createAdminProduct(
  input: Omit<AdminProduct, "id" | "createdAt" | "updatedAt" | "variants"> & {
    images?: string[];
    variants?: CreateProductInput["variants"];
    guitarSpecs?: Record<string, string>;
    spin360Images?: string[];
    inTheBox?: string[];
    videos?: ProductVideo[];
    detailSpecs?: ProductSpec[];
  },
): Promise<AdminProduct> {
  const created = await createProduct({
    name: input.name,
    brand: input.brand,
    brandSlug: input.brandSlug,
    category: input.category,
    categorySlug: input.categorySlug,
    subcategory: input.subcategory,
    price: input.price,
    originalPrice: input.originalPrice ?? input.price,
    stock: input.stockQuantity ?? 100,
    lowStockThreshold: input.lowStockThreshold,
    sku: input.sku,
    status: input.status ?? "active",
    description: input.description,
    slug: input.slug,
    rating: input.rating,
    reviewCount: input.reviewCount,
    availability: input.availability,
    condition: input.condition,
    imageColor: input.imageColor,
    image: input.image || getProductImage(input.slug, input.category),
    images: input.images,
    gstRate: input.gstRate,
    featured: input.featured,
    trending: input.trending,
    newArrival: input.newArrival,
    variants: input.variants,
    guitarSpecs: input.guitarSpecs,
    specifications: input.specifications,
    spin360Images: input.spin360Images,
    inTheBox: input.inTheBox,
    videos: input.videos,
    detailSpecs: input.detailSpecs,
  });
  return toAdminProduct(created);
}

export async function updateAdminProduct(
  id: string,
  patch: Partial<Omit<AdminProduct, "variants">> & {
    images?: string[];
    variants?: CreateProductInput["variants"];
    guitarSpecs?: Record<string, string>;
    spin360Images?: string[];
    inTheBox?: string[];
    videos?: ProductVideo[];
    detailSpecs?: ProductSpec[];
  },
): Promise<AdminProduct> {
  const needsSnapshot = patch.stockQuantity !== undefined || patch.price !== undefined;
  const existing = needsSnapshot ? await getProductById(id) : null;

  const updated = await updateProduct(id, {
    name: patch.name,
    brand: patch.brand,
    brandSlug: patch.brandSlug,
    category: patch.category,
    categorySlug: patch.categorySlug,
    subcategory: patch.subcategory,
    price: patch.price,
    originalPrice: patch.originalPrice,
    stock: patch.stockQuantity,
    lowStockThreshold: patch.lowStockThreshold,
    sku: patch.sku,
    status: patch.status,
    description: patch.description,
    slug: patch.slug,
    rating: patch.rating,
    reviewCount: patch.reviewCount,
    availability: patch.availability,
    condition: patch.condition,
    imageColor: patch.imageColor,
    image: patch.image,
    images: patch.images,
    gstRate: patch.gstRate,
    featured: patch.featured,
    trending: patch.trending,
    newArrival: patch.newArrival,
    variants: patch.variants,
    guitarSpecs: patch.guitarSpecs,
    specifications: patch.specifications,
    spin360Images: patch.spin360Images,
    inTheBox: patch.inTheBox,
    videos: patch.videos,
    detailSpecs: patch.detailSpecs,
  });

  if (existing && patch.stockQuantity !== undefined) {
    void notifyWaitlistOnRestock({
      productId: id,
      productName: updated.name,
      productSlug: updated.slug,
      previousStock: existing.stock,
      previousReserved: existing.reservedStock ?? 0,
      newStock: updated.stock,
      newReserved: updated.reservedStock ?? 0,
    }).catch(() => undefined);
  }

  if (existing && patch.price !== undefined) {
    void notifyWaitlistOnGoLive({
      productId: id,
      productName: updated.name,
      productSlug: updated.slug,
      previousPrice: existing.price,
      newPrice: updated.price,
    }).catch(() => undefined);
  }

  return toAdminProduct(updated);
}

export async function deleteAdminProduct(id: string): Promise<void> {
  const existing = await getProductById(id);
  if (!existing) {
    throw new Error("Product not found");
  }

  await purgeProductSideData([id]);
  await deleteProduct(id);
}

export async function duplicateAdminProduct(id: string): Promise<AdminProduct> {
  const original = await getProductById(id);
  if (!original) throw new Error("Product not found");

  const suffix = Date.now().toString(36);
  return createAdminProduct({
    ...toAdminProduct(original),
    slug: `${original.slug}-copy-${suffix}`,
    name: `${original.name} (Copy)`,
    sku: `${original.sku}-${suffix}`.slice(0, 20),
    status: "draft",
    images: original.images,
  });
}

export async function bulkUpdateProductStatus(
  ids: string[],
  status: NonNullable<AdminProduct["status"]>,
): Promise<number> {
  if (status === "active") return (await bulkActivateProducts(ids)).updated;
  if (status === "archived") return (await bulkArchiveProducts(ids)).updated;
  for (const id of ids) await updateProduct(id, { status });
  return ids.length;
}

export async function bulkDeleteAdminProducts(ids: string[]): Promise<number> {
  await purgeProductSideData(ids);
  return (await bulkDeleteProducts(ids)).deleted;
}

export async function bulkUpdateAdminStock(
  updates: Array<{ id: string; stockQuantity: number }>,
): Promise<number> {
  const before = new Map<string, { stock: number; reserved: number; name: string; slug: string }>();
  for (const update of updates) {
    const product = await getProductById(update.id);
    if (product) {
      before.set(update.id, {
        stock: product.stock,
        reserved: product.reservedStock ?? 0,
        name: product.name,
        slug: product.slug,
      });
    }
  }

  const result = await bulkUpdateStock(updates.map((u) => ({ id: u.id, stock: u.stockQuantity })));

  for (const update of updates) {
    const prev = before.get(update.id);
    if (!prev) continue;
    void notifyWaitlistOnRestock({
      productId: update.id,
      productName: prev.name,
      productSlug: prev.slug,
      previousStock: prev.stock,
      previousReserved: prev.reserved,
      newStock: update.stockQuantity,
      newReserved: prev.reserved,
    }).catch(() => undefined);
  }

  return result.updated;
}

export async function bulkUpdateAdminCategory(
  updates: Array<{ id: string; category: string; categorySlug: string }>,
): Promise<number> {
  return (await bulkUpdateCategory(updates)).updated;
}
