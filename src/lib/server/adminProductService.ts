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
import { rowsToCsv, type ParsedCsvRow } from "@/lib/csv";
import { prisma } from "@/lib/db/prisma";
import type { AdminProduct } from "@/types/admin";
import type { CatalogProduct, CreateProductInput } from "@/types/catalog";
import type { ProductSpec, ProductVideo } from "@/types/product";
import { paginateSortedById } from "@/lib/admin/paginateByCursor";

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
    salePrice:
      catalog.originalPrice > catalog.price ? catalog.price : null,
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

export async function listAdminProducts(options: {
  search?: string;
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
  cursor?: string;
} = {}): Promise<{
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
        (p.sku?.toLowerCase().includes(q) ?? false)
    );
  }

  if (options.status) {
    products = products.filter((p) => p.status === options.status);
  }

  if (options.category) {
    products = products.filter(
      (p) =>
        p.categorySlug === options.category || p.category === options.category
    );
  }

  products.sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
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
  const limit = options.limit ?? 20;
  products = products.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

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
export async function listAdminProductsForExport(options: {
  search?: string;
  status?: string;
  category?: string;
} = {}): Promise<AdminProduct[]> {
  const result = await listAdminProducts({
    ...options,
    limit: Number.MAX_SAFE_INTEGER,
    offset: 0,
  });
  return result.products;
}

const EXPORT_BASE_HEADERS = [
  "id",
  "slug",
  "name",
  "brand",
  "brandSlug",
  "category",
  "categorySlug",
  "subcategory",
  "price",
  "originalPrice",
  "gstRate",
  "stock",
  "lowStockThreshold",
  "sku",
  "status",
  "availability",
  "condition",
  "featured",
  "trending",
  "newArrival",
  "description",
  "rating",
  "reviewCount",
  "image",
  "imageColor",
  "specifications",
  "spin360Images",
  "createdAt",
  "updatedAt",
] as const;

function filterCatalogForExport(
  products: CatalogProduct[],
  options: { search?: string; status?: string; category?: string }
): CatalogProduct[] {
  let filtered = products;

  if (options.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  if (options.status) {
    filtered = filtered.filter((p) => p.status === options.status);
  }

  if (options.category) {
    filtered = filtered.filter(
      (p) =>
        p.categorySlug === options.category || p.category === options.category
    );
  }

  return filtered.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * CSV of full product details. Image files are not bundled — CDN/public URLs
 * are written as image1…imageN (at least image1–image5 for import compatibility).
 */
export async function buildAdminProductsExportCsv(options: {
  search?: string;
  status?: string;
  category?: string;
} = {}): Promise<string> {
  const products = filterCatalogForExport(await fetchAllProducts(true), options);
  const maxImages = Math.max(
    5,
    ...products.map((product) => product.images?.length ?? 0)
  );
  const imageHeaders = Array.from(
    { length: maxImages },
    (_, index) => `image${index + 1}`
  );
  const headers = [...EXPORT_BASE_HEADERS, ...imageHeaders];

  const rows: ParsedCsvRow[] = products.map((product) => {
    const images = product.images ?? [];
    const row: ParsedCsvRow = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      brandSlug: product.brandSlug,
      category: product.category,
      categorySlug: product.categorySlug,
      subcategory: product.subcategory ?? "",
      price: String(product.price ?? ""),
      originalPrice: String(product.originalPrice ?? ""),
      gstRate: product.gstRate != null ? String(product.gstRate) : "",
      stock: String(product.stock ?? ""),
      lowStockThreshold:
        product.lowStockThreshold != null
          ? String(product.lowStockThreshold)
          : "",
      sku: product.sku ?? "",
      status: product.status ?? "active",
      availability: product.availability ?? "",
      condition: product.condition ?? "",
      featured: String(Boolean(product.featured)),
      trending: String(Boolean(product.trending)),
      newArrival: String(Boolean(product.newArrival)),
      description: product.description ?? "",
      rating: String(product.rating ?? ""),
      reviewCount: String(product.reviewCount ?? ""),
      image: product.image ?? "",
      imageColor: product.imageColor ?? "",
      specifications: product.specifications
        ? JSON.stringify(product.specifications)
        : "",
      spin360Images: product.detail?.spin360Images?.length
        ? JSON.stringify(product.detail.spin360Images)
        : "",
      createdAt: product.createdAt ?? "",
      updatedAt: product.updatedAt ?? "",
    };

    for (let i = 0; i < maxImages; i += 1) {
      row[`image${i + 1}`] = images[i] ?? "";
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
  }
): Promise<AdminProduct> {
  const created = await createProduct({
    name: input.name,
    brand: input.brand,
    brandSlug: input.brandSlug,
    category: input.category,
    categorySlug: input.categorySlug,
    price: input.price,
    originalPrice: input.originalPrice ?? input.price,
    stock: input.stockQuantity ?? 100,
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
  }
): Promise<AdminProduct> {
  const needsSnapshot =
    patch.stockQuantity !== undefined || patch.price !== undefined;
  const existing = needsSnapshot ? await getProductById(id) : null;

  const updated = await updateProduct(id, {
    name: patch.name,
    brand: patch.brand,
    brandSlug: patch.brandSlug,
    category: patch.category,
    categorySlug: patch.categorySlug,
    price: patch.price,
    originalPrice: patch.originalPrice,
    stock: patch.stockQuantity,
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
  status: NonNullable<AdminProduct["status"]>
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
  updates: Array<{ id: string; stockQuantity: number }>
): Promise<number> {
  const before = new Map<
    string,
    { stock: number; reserved: number; name: string; slug: string }
  >();
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

  const result = await bulkUpdateStock(
    updates.map((u) => ({ id: u.id, stock: u.stockQuantity }))
  );

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
  updates: Array<{ id: string; category: string; categorySlug: string }>
): Promise<number> {
  return (await bulkUpdateCategory(updates)).updated;
}
