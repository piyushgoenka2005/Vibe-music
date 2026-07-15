import "server-only";

import { getProductImage } from "@/data/productImages";
import { findCategoryInList, normalizeCategorySlug } from "@/lib/categorySlug";
import {
  enrichGuitarSpecifications,
  GUITAR_SHOWCASE_FIELD_LABELS,
  isGuitarProduct,
} from "@/lib/product/guitarShowcaseSpecs";
import { mergeProductSpecs } from "@/lib/product/productSpecs";
import { slugify } from "@/lib/slug";
import {
  batchDeleteProducts as fsBatchDelete,
  batchUpdateProducts as fsBatchUpdate,
  batchWriteProducts,
  fetchAllProducts as fetchAllProductsFromDb,
  fetchBrands,
  fetchCategories,
  fetchExistingSlugsAndSkus,
  fetchProductById,
  fetchProductBySlug,
  fetchProductsByCategory,
  fetchProductsByIds,
  isCatalogUnavailable,
  removeProduct,
  skuExists,
  slugExists,
  writeProduct,
} from "@/lib/server/firestoreCatalogRepository";
import { getCachedCategories, getCachedProducts } from "@/lib/server/catalogSnapshotCache";
import { recordInventoryLogEntry } from "@/lib/server/inventoryRepository";
import {
  applyVariantsToProduct,
  fetchAllVariantSkus,
  getVariantsFromProduct,
} from "@/lib/server/variantService";
import {
  normalizeVariants,
  stockToVariantAvailability,
  syncProductAggregatesFromVariants,
} from "@/lib/variants";
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

async function resolveCategory(
  categoryInput: string
): Promise<{ name: string; slug: string } | null> {
  const categories = await fetchCategories();
  const found = findCategoryInList(categories, categoryInput);
  if (!found) return null;
  return { name: found.name, slug: found.slug };
}

function uniqueSlug(base: string, existing: Set<string>): string {
  const slug = slugify(base);
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

function applyGuitarSpecifications(
  name: string,
  brand: string,
  categorySlug: string,
  categoryName: string,
  specifications: Record<string, string>,
  guitarSpecs?: Record<string, string>
): Record<string, string> {
  if (!isGuitarProduct(categorySlug, categoryName)) {
    return specifications;
  }

  const merged = {
    ...specifications,
    ...Object.fromEntries(
      Object.entries(guitarSpecs ?? {}).filter(([, value]) => value.trim())
    ),
  };

  return enrichGuitarSpecifications(name, brand, merged);
}

function syncDetailSpecsFromSpecifications(
  detail: NonNullable<CatalogProduct["detail"]>,
  specifications: Record<string, string>
): NonNullable<CatalogProduct["detail"]> {
  const baseSpecs = detail.specs.filter(
    (spec) => !GUITAR_SHOWCASE_FIELD_LABELS.includes(spec.label)
  );
  const guitarSpecs = GUITAR_SHOWCASE_FIELD_LABELS.flatMap((label) => {
    const value = specifications[label]?.trim();
    return value ? [{ label, value }] : [];
  });

  return {
    ...detail,
    specs: [...baseSpecs, ...guitarSpecs],
  };
}

function buildDefaultDetail(
  product: CatalogProduct,
  allProducts: CatalogProduct[]
): NonNullable<CatalogProduct["detail"]> {
  const sameCategory = allProducts.filter(
    (p) =>
      p.categorySlug === product.categorySlug &&
      p.id !== product.id &&
      p.status === "active"
  );
  const sameBrand = allProducts.filter(
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
      ...(src ? { src } : {}),
    })),
    videos: [],
    variants: normalizeVariants(
      [
        {
          id: "var-default",
          label: "Standard",
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          isDefault: true,
        },
      ],
      product.sku,
      product.price,
      product.stock
    ),
    reviews: [],
    qa: [],
    frequentlyBoughtTogether: sameCategory.slice(0, 2).map((p) => p.id),
    similarProductIds: sameCategory.slice(0, 4).map((p) => p.id),
    relatedProductIds: [
      ...sameBrand.slice(0, 2),
      ...sameCategory.slice(2, 4),
    ].map((p) => p.id),
    spin360Images: [],
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
  const detail = catalogProduct.detail ?? buildDefaultDetail(catalogProduct, []);
  const variants = normalizeVariants(
    detail.variants.map((variant) => ({
      ...variant,
      stock: variant.stock ?? catalogProduct.stock,
      attributes: variant.attributes ?? [],
      images: variant.images ?? [],
    })),
    catalogProduct.sku,
    catalogProduct.price,
    catalogProduct.stock
  );

  return {
    ...toProduct(catalogProduct),
    sku: catalogProduct.sku,
    msrp: detail.msrp,
    salePrice: detail.salePrice,
    description: catalogProduct.description,
    specs: mergeProductSpecs(detail.specs, catalogProduct.specifications),
    inTheBox: detail.inTheBox,
    images: detail.gallery,
    videos: detail.videos,
    variants,
    reviews: detail.reviews,
    qa: detail.qa,
    frequentlyBoughtTogether: detail.frequentlyBoughtTogether,
    similarProductIds: detail.similarProductIds,
    relatedProductIds: detail.relatedProductIds,
    spin360Images: Array.isArray(detail.spin360Images)
      ? detail.spin360Images.filter((src): src is string => typeof src === "string" && src.length > 0)
      : [],
  };
}

export async function getAllProducts(
  includeInactive = false
): Promise<CatalogProduct[]> {
  return getCachedProducts(includeInactive);
}

async function loadLocalCatalogSnapshot(
  includeInactive = false
): Promise<CatalogProduct[]> {
  const { loadProducts } = await import("@/lib/server/catalogRepository");
  const products = loadProducts();
  return includeInactive
    ? products
    : products.filter((product) => product.status === "active");
}

async function fetchCatalogSnapshot(
  includeInactive = false
): Promise<CatalogProduct[]> {
  if (isCatalogUnavailable()) {
    return loadLocalCatalogSnapshot(includeInactive);
  }

  try {
    const products = await getCachedProducts(includeInactive);
    // Unseeded / emptied Postgres can be cached as []. Prefer local JSON until DB has data.
    if (products.length === 0) {
      const local = await loadLocalCatalogSnapshot(includeInactive);
      if (local.length > 0) return local;
    }
    return products;
  } catch {
    return loadLocalCatalogSnapshot(includeInactive);
  }
}

export function searchInCatalogProducts(
  initialSource: CatalogProduct[],
  options: ProductSearchOptions = {}
): Product[] {
  let source = initialSource;

  const purchasableOnly = options.purchasableOnly ?? !options.includeInactive;
  if (purchasableOnly) {
    source = source.filter((product) => product.price > 0);
  }

  if (options.category) {
    const resolvedSlug = normalizeCategorySlug(options.category);
    source = source.filter(
      (product) =>
        product.categorySlug === resolvedSlug ||
        normalizeCategorySlug(product.category) === resolvedSlug
    );
  }

  if (options.query) {
    const normalized = options.query.trim().toLowerCase();
    const merchandisingQuery =
      normalized === "trending" ||
      normalized === "best sellers" ||
      normalized === "bestsellers" ||
      normalized === "best+sellers" ||
      normalized === "new" ||
      normalized === "deals";

    if (merchandisingQuery) {
      if (normalized === "trending") {
        const flagged = source.filter((product) => product.trending);
        source =
          flagged.length > 0
            ? flagged
            : sortByPopularity(source.filter((product) => product.price > 0));
      } else if (
        normalized === "best sellers" ||
        normalized === "bestsellers" ||
        normalized === "best+sellers"
      ) {
        source = sortByPopularity(source);
      } else if (normalized === "new") {
        source = source.filter((product) => product.newArrival);
      } else if (normalized === "deals") {
        const discounted = source.filter(
          (product) =>
            product.discountPercentage > 0 ||
            (product.detail?.salePrice != null &&
              product.detail.salePrice < product.price)
        );
        source =
          discounted.length > 0
            ? discounted.sort(
                (a, b) => b.discountPercentage - a.discountPercentage
              )
            : sortByPopularity(source);
      }
    } else {
      const tokens = normalized.split(/\s+/).filter(Boolean);
      source = source
        .map((product) => ({
          product,
          score: scoreProductMatch(toProduct(product), tokens),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.product);
    }
  }

  if (options.brand) {
    const brand = options.brand.toLowerCase();
    source = source.filter(
      (product) =>
        product.brandSlug === brand ||
        product.brand.toLowerCase().replace(/\s+/g, "-") === brand
    );
  }

  if (options.conditions && options.conditions.length > 0) {
    const allowed = new Set(options.conditions);
    source = source.filter((product) => allowed.has(product.condition));
  } else if (options.condition) {
    source = source.filter((product) => product.condition === options.condition);
  }

  if (options.sort === "price-asc") {
    source = [...source].sort((a, b) => a.price - b.price);
  } else if (options.sort === "price-desc") {
    source = [...source].sort((a, b) => b.price - a.price);
  } else if (options.sort === "rating-desc") {
    source = [...source].sort((a, b) => b.rating - a.rating);
  } else if (options.sort === "reviews-desc") {
    source = [...source].sort((a, b) => b.reviewCount - a.reviewCount);
  } else if (!options.query) {
    // Keep relevance ordering for text queries; sort by newest otherwise.
    source = [...source].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  let products = source.map(toProduct);
  if (options.limit && options.limit > 0) {
    products = products.slice(0, options.limit);
  }
  return products;
}

export async function getProductById(
  id: string
): Promise<CatalogProduct | undefined> {
  const product = await fetchProductById(id);
  return product ?? undefined;
}

export async function getCatalogProductBySlug(
  slug: string
): Promise<CatalogProduct | undefined> {
  const product = await fetchProductBySlug(slug);
  return product ?? undefined;
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  const product = await getCatalogProductBySlug(slug);
  if (!product || product.status !== "active") return undefined;
  return toProduct(product);
}

export async function getProductDetailBySlug(
  slug: string
): Promise<ProductDetail | undefined> {
  const product = await getCatalogProductBySlug(slug);
  if (!product || product.status !== "active") return undefined;
  return toProductDetail(product);
}

export async function getProductsByCategory(
  categorySlug: string
): Promise<Product[]> {
  const categories = await fetchCategories();
  const category = findCategoryInList(categories, categorySlug);
  const resolvedSlug = category?.slug ?? normalizeCategorySlug(categorySlug);
  const products = await fetchProductsByCategory(resolvedSlug);
  return products.map(toProduct);
}

function sortByPopularity(products: CatalogProduct[]): CatalogProduct[] {
  return [...products].sort(
    (a, b) =>
      b.reviewCount - a.reviewCount ||
      b.rating - a.rating ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await fetchCatalogSnapshot();
  const featured = products.filter((p) => p.featured);
  const source =
    featured.length > 0
      ? featured
      : sortByPopularity(products.filter((p) => p.price > 0)).slice(0, 12);
  return source.map(toProduct);
}

export async function getTrendingProducts(): Promise<Product[]> {
  const products = await fetchCatalogSnapshot();
  const trending = products.filter((p) => p.trending);
  if (trending.length > 0) {
    return trending.map(toProduct);
  }
  // Keep storefront rails populated when no products are flagged yet.
  return sortByPopularity(products.filter((p) => p.price > 0))
    .slice(0, 12)
    .map(toProduct);
}

export async function getNewArrivals(): Promise<Product[]> {
  const products = await fetchCatalogSnapshot();
  return products.filter((p) => p.newArrival).map(toProduct);
}

export async function getRelatedProducts(
  slug: string,
  limit = 8
): Promise<Product[]> {
  const { resolveRelatedProductsBySlug } = await import(
    "@/lib/server/relatedProductsService"
  );
  const resolved = await resolveRelatedProductsBySlug(slug, limit);
  return resolved.products;
}

export interface ProductSearchOptions {
  query?: string;
  category?: string;
  brand?: string;
  sort?: string;
  condition?: Product["condition"];
  /** Prefer over single `condition` when filtering used + open-box together. */
  conditions?: Product["condition"][];
  limit?: number;
  includeInactive?: boolean;
  /** When true (default on storefront), hide ₹0 Coming Soon SKUs from listings. */
  purchasableOnly?: boolean;
}

function scoreProductMatch(
  product: Product,
  tokens: string[]
): number {
  if (tokens.length === 0) return 0;

  const name = product.name.toLowerCase();
  const brand = product.brand.toLowerCase();
  const category = product.category.toLowerCase();
  const slug = product.slug.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (slug === token) score += 120;
    if (name === token) score += 100;
    if (name.startsWith(token)) score += 60;
    if (brand.startsWith(token)) score += 40;
    if (name.includes(token)) score += 30;
    if (brand.includes(token)) score += 20;
    if (category.includes(token)) score += 15;
    if (slug.includes(token)) score += 10;
  }

  const allTokensMatch = tokens.every(
    (token) =>
      name.includes(token) ||
      brand.includes(token) ||
      category.includes(token) ||
      slug.includes(token)
  );
  if (allTokensMatch) score += 25 * tokens.length;

  // Popularity/stock boosts only apply to actual text matches; otherwise
  // every in-stock product would match every query.
  if (score === 0) return 0;

  score += product.rating * 2 + Math.min(product.reviewCount, 50) * 0.1;
  if (product.availability === "in-stock") score += 5;
  return score;
}

export async function searchProducts(
  options: ProductSearchOptions = {}
): Promise<Product[]> {
  const source = await fetchCatalogSnapshot(options.includeInactive ?? false);
  return searchInCatalogProducts(source, options);
}

export async function getBrands(): Promise<Brand[]> {
  return fetchBrands();
}

export async function getCategories(): Promise<Category[]> {
  const categories = await getCachedCategories();
  const products = await fetchCatalogSnapshot(true);
  const countBySlug = new Map<string, number>();

  for (const product of products) {
    if (product.status !== "active") continue;
    countBySlug.set(
      product.categorySlug,
      (countBySlug.get(product.categorySlug) ?? 0) + 1
    );
  }

  return categories.map((category) => ({
    ...category,
    productCount: countBySlug.get(category.slug) ?? 0,
  }));
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  const categories = await fetchCategories();
  return findCategoryInList(categories, slug);
}

export async function getProductSummaries(ids: string[]): Promise<Product[]> {
  const products = await fetchProductsByIds(ids);
  return products.map(toProduct);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const products = await fetchCatalogSnapshot();
  return products.map((p) => p.slug);
}

export async function createProduct(
  input: CreateProductInput
): Promise<CatalogProduct> {
  const { slugs, skus } = await fetchExistingSlugsAndSkus();
  const category = await resolveCategory(input.categorySlug ?? input.category);
  if (!category) {
    throw new Error(`Category "${input.category}" not found`);
  }

  const slug = uniqueSlug(
    slugify(input.slug ?? `${input.brand}-${input.name}`),
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

  const baseSpecifications = input.specifications ?? {
    Manufacturer: input.brand,
    Category: category.name,
    SKU: sku,
  };
  const specifications = applyGuitarSpecifications(
    input.name,
    input.brand,
    category.slug,
    category.name,
    baseSpecifications,
    input.guitarSpecs
  );

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
    reservedStock: 0,
    lowStockThreshold: input.lowStockThreshold ?? 10,
    sku,
    status: input.status ?? "active",
    featured: input.featured ?? false,
    trending: input.trending ?? false,
    newArrival: input.newArrival ?? false,
    images: input.images?.length ? input.images : [primaryImage],
    description:
      input.description ??
      `The ${input.brand} ${input.name} delivers professional-grade performance for ${category.name.toLowerCase()} applications.`,
    specifications,
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

  const all = await fetchAllProductsFromDb(true);
  product.detail = buildDefaultDetail(product, all);

  if (input.spin360Images?.length) {
    product.detail = {
      ...product.detail,
      spin360Images: input.spin360Images.filter(
        (src): src is string => typeof src === "string" && src.length > 0
      ),
    };
  }

  if (input.variants?.length) {
    const existingSkus = await fetchAllVariantSkus();
    return writeProduct(
      applyVariantsToProduct(product, input.variants, existingSkus)
    );
  }

  return writeProduct(product);
}

export async function updateProduct(
  id: string,
  patch: UpdateProductInput
): Promise<CatalogProduct> {
  const current = await fetchProductById(id);
  if (!current) throw new Error("Product not found");

  const now = new Date().toISOString();
  let category = { name: current.category, slug: current.categorySlug };

  if (patch.category || patch.categorySlug) {
    const resolved = await resolveCategory(patch.categorySlug ?? patch.category ?? "");
    if (!resolved) {
      throw new Error(`Category "${patch.category ?? patch.categorySlug}" not found`);
    }
    category = resolved;
  }

  if (patch.slug && slugify(patch.slug) !== current.slug) {
    if (await slugExists(slugify(patch.slug), id)) throw new Error("Slug already exists");
  }

  if (patch.sku && patch.sku !== current.sku) {
    if (await skuExists(patch.sku, id)) throw new Error("SKU already exists");
  }

  const stock = patch.stock ?? current.stock;
  const price = patch.price ?? current.price;
  const originalPrice = patch.originalPrice ?? current.originalPrice;

  const nextSpecifications = applyGuitarSpecifications(
    patch.name ?? current.name,
    patch.brand ?? current.brand,
    category.slug,
    category.name,
    {
      ...current.specifications,
      ...(patch.specifications ?? {}),
    },
    patch.guitarSpecs
  );

  const updated: CatalogProduct = {
    ...current,
    ...patch,
    slug: patch.slug ? slugify(patch.slug) : current.slug,
    category: category.name,
    categorySlug: category.slug,
    stock,
    price,
    originalPrice,
    discountPercentage: computeDiscount(price, originalPrice),
    availability: patch.availability ?? stockToAvailability(stock),
    brandSlug:
      patch.brandSlug ??
      (patch.brand ? slugify(patch.brand) : current.brandSlug),
    specifications: nextSpecifications,
    updatedAt: now,
  };

  if (patch.specifications) {
    updated.specifications = {
      ...current.specifications,
      ...patch.specifications,
    };
  }

  if (patch.images?.length) {
    updated.image = patch.images[0];
    updated.images = patch.images;
  }

  const all = await fetchAllProductsFromDb(true);
  const preservedDetail = syncDetailSpecsFromSpecifications(
    current.detail ?? buildDefaultDetail({ ...current, specifications: nextSpecifications }, all),
    nextSpecifications
  );

  if (patch.variants) {
    const existingSkus = await fetchAllVariantSkus(id);
    updated.detail = applyVariantsToProduct(
      { ...updated, detail: preservedDetail },
      patch.variants,
      existingSkus
    ).detail;
    const aggregates = syncProductAggregatesFromVariants(
      getVariantsFromProduct({ ...updated, detail: updated.detail })
    );
    updated.price = aggregates.price;
    updated.stock = aggregates.stock;
    updated.availability = aggregates.availability;
  } else if (stock !== current.stock || price !== current.price) {
    const currentVariants = getVariantsFromProduct({
      ...updated,
      detail: preservedDetail,
    });
    const syncedVariants = currentVariants.map((variant) => {
      if (currentVariants.length === 1 && variant.isDefault) {
        return {
          ...variant,
          price: updated.price,
          stock: updated.stock,
          availability: stockToVariantAvailability(updated.stock),
        };
      }
      return variant;
    });
    updated.detail = { ...preservedDetail, variants: syncedVariants };
    updated.availability =
      syncProductAggregatesFromVariants(syncedVariants).availability;
  } else {
    updated.detail = {
      ...preservedDetail,
      variants: getVariantsFromProduct({ ...updated, detail: preservedDetail }),
    };
  }

  if (patch.specifications) {
    updated.detail = {
      ...(updated.detail ?? preservedDetail),
      specs: mergeProductSpecs(
        updated.detail?.specs ?? preservedDetail.specs,
        updated.specifications
      ),
    };
  }

  if (patch.spin360Images !== undefined) {
    updated.detail = {
      ...(updated.detail ?? preservedDetail),
      spin360Images: patch.spin360Images.filter(
        (src): src is string => typeof src === "string" && src.length > 0
      ),
    };
  }

  return writeProduct({ ...updated, id });
}

export async function deleteProduct(id: string): Promise<void> {
  await removeProduct(id);
}

export async function bulkDeleteProducts(
  ids: string[]
): Promise<BulkDeleteResult> {
  const deleted = await fsBatchDelete(ids);
  return { deleted };
}

export async function bulkArchiveProducts(
  ids: string[]
): Promise<BulkStatusResult> {
  return bulkSetStatus(ids, "archived");
}

export async function bulkActivateProducts(
  ids: string[]
): Promise<BulkStatusResult> {
  return bulkSetStatus(ids, "active");
}

async function bulkSetStatus(
  ids: string[],
  status: ProductStatus
): Promise<BulkStatusResult> {
  const updated = await fsBatchUpdate(ids, { status });
  return { updated };
}

export async function bulkUpdateStock(
  updates: BulkStockUpdate[]
): Promise<BulkStatusResult> {
  let count = 0;
  for (const { id, stock } of updates) {
    await updateProduct(id, { stock });
    count += 1;
  }
  return { updated: count };
}

export async function bulkUpdateCategory(
  updates: BulkCategoryUpdate[]
): Promise<BulkStatusResult> {
  let count = 0;
  for (const { id, category, categorySlug } of updates) {
    await updateProduct(id, { category, categorySlug });
    count += 1;
  }
  return { updated: count };
}

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
}

export async function previewBulkImport(
  rows: BulkImportRow[]
): Promise<BulkImportPreviewRow[]> {
  const { slugs, skus } = await fetchExistingSlugsAndSkus();
  const previewSlugs = new Set<string>();
  const previewSkus = new Set<string>();

  return Promise.all(
    rows.map(async (row, index) => {
      const errors: string[] = [];
      const rowNumber = index + 2;

      if (!row.name?.trim()) errors.push("Name is required");
      if (!row.brand?.trim()) errors.push("Brand is required");
      if (!row.category?.trim()) errors.push("Category is required");
      if (
        row.price == null ||
        Number.isNaN(Number(row.price)) ||
        Number(row.price) <= 0
      ) {
        errors.push("Valid price is required");
      }

      const category = row.category?.trim()
        ? await resolveCategory(row.category.trim())
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

      const imageRefs = [
        row.image1,
        row.image2,
        row.image3,
        row.image4,
        row.image5,
      ].filter(Boolean) as string[];

      const isUrl = (v: string) =>
        v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/");

      if (imageRefs.length === 0 && !row.resolvedImages?.length) {
        errors.push("At least one image is required");
      } else if (
        row.resolvedImages?.length &&
        row.resolvedImages.length < imageRefs.filter((r) => !isUrl(r)).length
      ) {
        errors.push("Some image filenames were not found in ZIP");
      }

      return {
        ...row,
        rowNumber,
        errors,
        valid: errors.length === 0,
        resolvedCategorySlug: category?.slug,
        generatedSlug,
        generatedSku,
      };
    })
  );
}

export async function bulkImportProducts(
  rows: BulkImportRow[]
): Promise<BulkImportResult> {
  const preview = await previewBulkImport(rows);
  const validRows = preview.filter((r) => r.valid);
  const failedRows = preview
    .filter((r) => !r.valid)
    .map((r) => ({ ...r, reason: r.errors.join("; ") }));

  const importedProducts: CatalogProduct[] = [];

  for (const row of validRows) {
    const images =
      row.resolvedImages ??
      [row.image1, row.image2, row.image3, row.image4, row.image5].filter(
        (img): img is string => Boolean(img?.trim())
      );

    const product = await createProduct({
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
      images,
    });
    importedProducts.push(product);
    await recordInventoryLogEntry({
      productId: product.id,
      sku: product.sku,
      orderId: null,
      previousStock: 0,
      newStock: product.stock,
      quantityChanged: product.stock,
      action: "bulk_import",
      adminId: null,
      timestamp: new Date().toISOString(),
      note: "Initial stock from bulk import",
    });
  }

  return {
    imported: importedProducts.length,
    skipped: failedRows.length,
    errors: failedRows.length,
    failedRows,
    products: importedProducts,
  };
}

export type CatalogDataSource = "postgres" | "local";

export { batchWriteProducts };
