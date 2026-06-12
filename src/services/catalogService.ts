import "server-only";

import { getProductImage } from "@/data/productImages";
import { slugify } from "@/lib/slug";
import {
  loadCategories,
  loadProducts,
  saveProducts,
} from "@/lib/server/catalogRepository";
import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import type {
  BulkCategoryUpdate,
  BulkDeleteResult,
  BulkImportPreviewRow,
  BulkImportResult,
  BulkImportRow,
  BulkStatusResult,
  BulkStockUpdate,
  CatalogProduct,
  CreateProductInput,
  ProductStatus,
  UpdateProductInput,
} from "@/types/catalog";
import type { Product, ProductDetail } from "@/types/product";

function activeOnly(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter((p) => p.status === "active");
}

function resolveCategory(
  categoryInput: string
): { name: string; slug: string } | null {
  const categories = loadCategories();
  const bySlug = categories.find(
    (c) => c.slug === categoryInput.toLowerCase()
  );
  if (bySlug) return { name: bySlug.name, slug: bySlug.slug };

  const byName = categories.find(
    (c) => c.name.toLowerCase() === categoryInput.toLowerCase()
  );
  if (byName) return { name: byName.name, slug: byName.slug };

  return null;
}

function uniqueSlug(base: string, existing: Set<string>): string {
  let slug = slugify(base);
  if (!existing.has(slug)) return slug;
  let i = 2;
  while (existing.has(`${slug}-${i}`)) i += 1;
  return `${slug}-${i}`;
}

function uniqueSku(existing: Set<string>): string {
  let n = existing.size + 1;
  let sku = `VM-${String(n).padStart(5, "0")}`;
  while (existing.has(sku)) {
    n += 1;
    sku = `VM-${String(n).padStart(5, "0")}`;
  }
  return sku;
}

function computeDiscount(price: number, originalPrice: number): number {
  if (originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

function stockToAvailability(stock: number): Product["availability"] {
  if (stock <= 0) return "out-of-stock";
  if (stock <= 5) return "limited";
  return "in-stock";
}

function buildDefaultDetail(product: CatalogProduct): NonNullable<CatalogProduct["detail"]> {
  const sameCategory = loadProducts().filter(
    (p) =>
      p.categorySlug === product.categorySlug &&
      p.id !== product.id &&
      p.status === "active"
  );
  const sameBrand = loadProducts().filter(
    (p) =>
      p.brandSlug === product.brandSlug &&
      p.id !== product.id &&
      p.status === "active"
  );

  return {
    msrp: product.originalPrice > product.price ? product.originalPrice : null,
    salePrice: product.originalPrice > product.price ? product.price : null,
    specs: Object.entries(product.specifications).map(([label, value]) => ({
      label,
      value,
    })),
    inTheBox: [product.name, "Manufacturer documentation", "Warranty card"],
    gallery: product.images.map((src, i) => ({
      id: `img-${i}`,
      alt: `${product.name} view ${i + 1}`,
      color: product.imageColor,
      src: i === 0 ? src : undefined,
    })),
    videos: [],
    variants: [
      {
        id: "var-default",
        label: "Standard",
        sku: product.sku,
        price: product.price,
        availability: product.availability,
      },
    ],
    reviews: [],
    qa: [],
    frequentlyBoughtTogether: sameCategory.slice(0, 2).map((p) => p.id),
    similarProductIds: sameCategory.slice(0, 4).map((p) => p.id),
    relatedProductIds: [
      ...sameBrand.slice(0, 2),
      ...sameCategory.slice(2, 4),
    ].map((p) => p.id),
  };
}

export function toProduct(catalogProduct: CatalogProduct): Product {
  return {
    id: catalogProduct.id,
    slug: catalogProduct.slug,
    name: catalogProduct.name,
    brand: catalogProduct.brand,
    brandSlug: catalogProduct.brandSlug,
    category: catalogProduct.category,
    categorySlug: catalogProduct.categorySlug,
    price: catalogProduct.price,
    gstRate: catalogProduct.gstRate,
    rating: catalogProduct.rating,
    reviewCount: catalogProduct.reviewCount,
    availability: catalogProduct.availability,
    condition: catalogProduct.condition,
    imageColor: catalogProduct.imageColor,
    image: catalogProduct.image,
  };
}

export function toProductDetail(catalogProduct: CatalogProduct): ProductDetail {
  const detail = catalogProduct.detail ?? buildDefaultDetail(catalogProduct);

  return {
    ...toProduct(catalogProduct),
    sku: catalogProduct.sku,
    msrp: detail.msrp,
    salePrice: detail.salePrice,
    description: catalogProduct.description,
    specs: detail.specs,
    inTheBox: detail.inTheBox,
    images: detail.gallery,
    videos: detail.videos,
    variants: detail.variants,
    reviews: detail.reviews,
    qa: detail.qa,
    frequentlyBoughtTogether: detail.frequentlyBoughtTogether,
    similarProductIds: detail.similarProductIds,
    relatedProductIds: detail.relatedProductIds,
  };
}

export function getAllProducts(includeInactive = false): CatalogProduct[] {
  const products = loadProducts();
  return includeInactive ? products : activeOnly(products);
}

export function getProductById(id: string): CatalogProduct | undefined {
  return loadProducts().find((p) => p.id === id);
}

export function getCatalogProductBySlug(
  slug: string
): CatalogProduct | undefined {
  return loadProducts().find((p) => p.slug === slug);
}

export function getProductBySlug(slug: string): Product | undefined {
  const product = getCatalogProductBySlug(slug);
  if (!product || product.status !== "active") return undefined;
  return toProduct(product);
}

export function getProductDetailBySlug(slug: string): ProductDetail | undefined {
  const product = getCatalogProductBySlug(slug);
  if (!product || product.status !== "active") return undefined;
  return toProductDetail(product);
}

function sortByNewest(products: CatalogProduct[]): CatalogProduct[] {
  return [...products].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return sortByNewest(
    activeOnly(loadProducts()).filter((p) => p.categorySlug === categorySlug)
  ).map(toProduct);
}

export function getFeaturedProducts(): Product[] {
  return activeOnly(loadProducts())
    .filter((p) => p.featured)
    .map(toProduct);
}

export function getTrendingProducts(): Product[] {
  return activeOnly(loadProducts())
    .filter((p) => p.trending)
    .map(toProduct);
}

export function getNewArrivals(): Product[] {
  return activeOnly(loadProducts())
    .filter((p) => p.newArrival)
    .map(toProduct);
}

export function getRelatedProducts(slug: string, limit = 4): Product[] {
  const product = getCatalogProductBySlug(slug);
  if (!product) return [];

  const relatedIds = product.detail?.relatedProductIds ?? [];
  const idMap = new Map(loadProducts().map((p) => [p.id, p]));

  const fromIds = relatedIds
    .map((id) => idMap.get(id))
    .filter((p): p is CatalogProduct => Boolean(p && p.status === "active"))
    .slice(0, limit)
    .map(toProduct);

  if (fromIds.length >= limit) return fromIds;

  const fallback = activeOnly(loadProducts())
    .filter(
      (p) => p.categorySlug === product.categorySlug && p.slug !== slug
    )
    .slice(0, limit - fromIds.length)
    .map(toProduct);

  return [...fromIds, ...fallback];
}

export interface ProductSearchOptions {
  query?: string;
  category?: string;
  brand?: string;
  sort?: string;
  condition?: Product["condition"];
  limit?: number;
  includeInactive?: boolean;
}

function matchesQuery(product: Product, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [product.name, product.brand, product.category, product.slug].some(
    (value) => value.toLowerCase().includes(normalized)
  );
}

export function searchProducts(options: ProductSearchOptions = {}): Product[] {
  let source = options.includeInactive
    ? loadProducts()
    : activeOnly(loadProducts());

  if (options.query) {
    const normalized = options.query.trim().toLowerCase();
    source = source.filter((p) => {
      const product = toProduct(p);
      return matchesQuery(product, normalized);
    });
  }

  if (options.category) {
    const category = options.category.toLowerCase();
    source = source.filter(
      (p) =>
        p.categorySlug === category ||
        p.category.toLowerCase().replace(/\s+/g, "-") === category
    );
  }

  if (options.brand) {
    const brand = options.brand.toLowerCase();
    source = source.filter(
      (p) =>
        p.brandSlug === brand ||
        p.brand.toLowerCase().replace(/\s+/g, "-") === brand
    );
  }

  if (options.condition) {
    source = source.filter((p) => p.condition === options.condition);
  }

  if (options.sort === "price-asc") {
    source = [...source].sort((a, b) => a.price - b.price);
  } else if (options.sort === "price-desc") {
    source = [...source].sort((a, b) => b.price - a.price);
  } else if (options.sort === "rating-desc") {
    source = [...source].sort((a, b) => b.rating - a.rating);
  } else if (options.sort === "reviews-desc") {
    source = [...source].sort((a, b) => b.reviewCount - a.reviewCount);
  } else {
    source = sortByNewest(source);
  }

  let products = source.map(toProduct);

  if (options.limit && options.limit > 0) {
    products = products.slice(0, options.limit);
  }

  return products;
}

export function getBrands(): Brand[] {
  const map = new Map<string, Brand>();
  activeOnly(loadProducts()).forEach((p) => {
    if (!map.has(p.brandSlug)) {
      map.set(p.brandSlug, {
        id: p.brandSlug,
        name: p.brand,
        slug: p.brandSlug,
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getCategories(): Category[] {
  const products = loadProducts();
  return loadCategories().map((category) => ({
    ...category,
    productCount: products.filter(
      (p) => p.categorySlug === category.slug && p.status === "active"
    ).length,
  }));
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getCategories().find((c) => c.slug === slug);
}

export function getProductSummaries(ids: string[]): Product[] {
  const idMap = new Map(loadProducts().map((p) => [p.id, p]));
  return ids
    .map((id) => idMap.get(id))
    .filter((p): p is CatalogProduct => Boolean(p && p.status === "active"))
    .map(toProduct);
}

export function getAllProductSlugs(): string[] {
  return activeOnly(loadProducts()).map((p) => p.slug);
}

export function createProduct(input: CreateProductInput): CatalogProduct {
  const products = loadProducts();
  const slugs = new Set(products.map((p) => p.slug));
  const skus = new Set(products.map((p) => p.sku));

  const category = resolveCategory(input.categorySlug ?? input.category);
  if (!category) {
    throw new Error(`Category "${input.category}" not found`);
  }

  const slug = uniqueSlug(
    input.slug ?? `${input.brand}-${input.name}`,
    slugs
  );
  const sku = input.sku && !skus.has(input.sku) ? input.sku : uniqueSku(skus);
  const brandSlug = input.brandSlug ?? slugify(input.brand);
  const now = new Date().toISOString();
  const stock = input.stock ?? 100;
  const originalPrice = input.originalPrice ?? input.price;
  const primaryImage =
    input.image ??
    input.images?.[0] ??
    getProductImage(slug, category.name);

  const product: CatalogProduct = {
    id: `prod-${Date.now().toString(36)}`,
    slug,
    name: input.name,
    brand: input.brand,
    category: category.name,
    subcategory: input.subcategory ?? "",
    price: input.price,
    originalPrice,
    discountPercentage: computeDiscount(input.price, originalPrice),
    rating: input.rating ?? 0,
    reviewCount: input.reviewCount ?? 0,
    stock,
    sku,
    status: input.status ?? "active",
    featured: input.featured ?? false,
    trending: input.trending ?? false,
    newArrival: input.newArrival ?? false,
    images: input.images?.length ? input.images : [primaryImage],
    description:
      input.description ??
      `The ${input.brand} ${input.name} delivers professional-grade performance for ${category.name.toLowerCase()} applications.`,
    specifications: input.specifications ?? {
      Manufacturer: input.brand,
      Category: category.name,
      SKU: sku,
    },
    createdAt: now,
    updatedAt: now,
    brandSlug,
    categorySlug: category.slug,
    availability: input.availability ?? stockToAvailability(stock),
    condition: input.condition ?? "new",
    imageColor: input.imageColor ?? "#e8e8e8",
    image: primaryImage,
    gstRate: input.gstRate,
  };

  product.detail = buildDefaultDetail(product);
  products.unshift(product);
  saveProducts(products);
  return product;
}

export function updateProduct(
  id: string,
  patch: UpdateProductInput
): CatalogProduct {
  const products = loadProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Product not found");

  const current = products[index];
  const now = new Date().toISOString();

  let category = {
    name: current.category,
    slug: current.categorySlug,
  };
  if (patch.category || patch.categorySlug) {
    const resolved = resolveCategory(patch.categorySlug ?? patch.category ?? "");
    if (!resolved) {
      throw new Error(`Category "${patch.category ?? patch.categorySlug}" not found`);
    }
    category = resolved;
  }

  if (patch.slug && patch.slug !== current.slug) {
    const slugs = new Set(products.filter((p) => p.id !== id).map((p) => p.slug));
    if (slugs.has(patch.slug)) throw new Error("Slug already exists");
  }

  if (patch.sku && patch.sku !== current.sku) {
    const skus = new Set(products.filter((p) => p.id !== id).map((p) => p.sku));
    if (skus.has(patch.sku)) throw new Error("SKU already exists");
  }

  const stock = patch.stock ?? current.stock;
  const price = patch.price ?? current.price;
  const originalPrice = patch.originalPrice ?? current.originalPrice;

  const updated: CatalogProduct = {
    ...current,
    ...patch,
    category: category.name,
    categorySlug: category.slug,
    stock,
    price,
    originalPrice,
    discountPercentage: computeDiscount(price, originalPrice),
    availability:
      patch.availability ?? stockToAvailability(stock),
    brandSlug: patch.brandSlug ?? (patch.brand ? slugify(patch.brand) : current.brandSlug),
    updatedAt: now,
  };

  if (patch.images?.length) {
    updated.image = patch.images[0];
  }

  updated.detail = buildDefaultDetail(updated);
  products[index] = updated;
  saveProducts(products);
  return updated;
}

export function deleteProduct(id: string): void {
  const products = loadProducts();
  const next = products.filter((p) => p.id !== id);
  if (next.length === products.length) throw new Error("Product not found");
  saveProducts(next);
}

export function bulkDeleteProducts(ids: string[]): BulkDeleteResult {
  const idSet = new Set(ids);
  const products = loadProducts();
  const next = products.filter((p) => !idSet.has(p.id));
  const deleted = products.length - next.length;
  saveProducts(next);
  return { deleted };
}

export function bulkArchiveProducts(ids: string[]): BulkStatusResult {
  return bulkSetStatus(ids, "archived");
}

export function bulkActivateProducts(ids: string[]): BulkStatusResult {
  return bulkSetStatus(ids, "active");
}

function bulkSetStatus(ids: string[], status: ProductStatus): BulkStatusResult {
  const idSet = new Set(ids);
  const now = new Date().toISOString();
  const products = loadProducts().map((p) =>
    idSet.has(p.id) ? { ...p, status, updatedAt: now } : p
  );
  saveProducts(products);
  return { updated: ids.length };
}

export function bulkUpdateStock(updates: BulkStockUpdate[]): BulkStatusResult {
  const map = new Map(updates.map((u) => [u.id, u.stock]));
  const now = new Date().toISOString();
  let count = 0;
  const products = loadProducts().map((p) => {
    const stock = map.get(p.id);
    if (stock === undefined) return p;
    count += 1;
    return {
      ...p,
      stock,
      availability: stockToAvailability(stock),
      updatedAt: now,
    };
  });
  saveProducts(products);
  return { updated: count };
}

export function bulkUpdateCategory(updates: BulkCategoryUpdate[]): BulkStatusResult {
  const map = new Map(updates.map((u) => [u.id, u]));
  const now = new Date().toISOString();
  let count = 0;
  const products = loadProducts().map((p) => {
    const patch = map.get(p.id);
    if (!patch) return p;
    count += 1;
    const next = {
      ...p,
      category: patch.category,
      categorySlug: patch.categorySlug,
      updatedAt: now,
    };
    next.detail = buildDefaultDetail(next);
    return next;
  });
  saveProducts(products);
  return { updated: count };
}

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
}

export function previewBulkImport(rows: BulkImportRow[]): BulkImportPreviewRow[] {
  const products = loadProducts();
  const slugs = new Set(products.map((p) => p.slug));
  const skus = new Set(products.map((p) => p.sku));
  const previewSlugs = new Set<string>();
  const previewSkus = new Set<string>();

  return rows.map((row, index) => {
    const errors: string[] = [];
    const rowNumber = index + 2;

    if (!row.name?.trim()) errors.push("Name is required");
    if (!row.brand?.trim()) errors.push("Brand is required");
    if (!row.category?.trim()) errors.push("Category is required");
    if (row.price == null || Number.isNaN(Number(row.price)) || Number(row.price) <= 0) {
      errors.push("Valid price is required");
    }

    const category = row.category?.trim()
      ? resolveCategory(row.category.trim())
      : null;
    if (row.category?.trim() && !category) {
      errors.push(`Category "${row.category}" not found`);
    }

    const generatedSlug = row.name
      ? uniqueSlug(`${row.brand}-${row.name}`, new Set([...slugs, ...previewSlugs]))
      : "";
    if (previewSlugs.has(generatedSlug)) {
      errors.push("Duplicate slug in import batch");
    }
    previewSlugs.add(generatedSlug);

    const generatedSku = row.sku?.trim()
      ? row.sku.trim()
      : uniqueSku(new Set([...skus, ...previewSkus]));
    if (skus.has(generatedSku) || previewSkus.has(generatedSku)) {
      errors.push("Duplicate SKU");
    }
    previewSkus.add(generatedSku);

    return {
      ...row,
      rowNumber,
      errors,
      valid: errors.length === 0,
      resolvedCategorySlug: category?.slug,
      generatedSlug,
      generatedSku,
    };
  });
}

export function bulkImportProducts(rows: BulkImportRow[]): BulkImportResult {
  const preview = previewBulkImport(rows);
  const validRows = preview.filter((r) => r.valid);
  const failedRows = preview
    .filter((r) => !r.valid)
    .map((r) => ({ ...r, reason: r.errors.join("; ") }));

  const importedProducts: CatalogProduct[] = [];

  for (const row of validRows) {
    const images = [row.image1, row.image2, row.image3].filter(
      (img): img is string => Boolean(img?.trim())
    );
    const product = createProduct({
      name: row.name.trim(),
      brand: row.brand.trim(),
      category: row.category.trim(),
      categorySlug: row.resolvedCategorySlug,
      subcategory: row.subcategory?.trim() ?? "",
      price: Number(row.price),
      originalPrice: row.originalPrice ? Number(row.originalPrice) : undefined,
      stock: row.stock != null ? Number(row.stock) : undefined,
      sku: row.generatedSku,
      slug: row.generatedSlug,
      description: row.description?.trim(),
      featured: parseBool(String(row.featured ?? "")),
      trending: parseBool(String(row.trending ?? "")),
      newArrival: parseBool(String(row.newArrival ?? "")),
      images: images.length ? images : undefined,
    });
    importedProducts.push(product);
  }

  return {
    imported: importedProducts.length,
    skipped: failedRows.length,
    errors: failedRows.length,
    failedRows,
    products: importedProducts,
  };
}

export type CatalogDataSource = "json" | "firestore" | "postgres";
