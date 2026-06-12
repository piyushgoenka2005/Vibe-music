import "server-only";

import { getProductImage } from "@/data/productImages";
import { slugify } from "@/lib/slug";
import {
  batchDeleteProducts as fsBatchDelete,
  batchUpdateProducts as fsBatchUpdate,
  batchWriteProducts,
  fetchAllProducts,
  fetchBrands,
  fetchCategories,
  fetchExistingSlugsAndSkus,
  fetchProductById,
  fetchProductBySlug,
  fetchProductsByCategory,
  removeProduct,
  skuExists,
  slugExists,
  writeProduct,
} from "@/lib/server/firestoreCatalogRepository";
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
  const normalized = categoryInput.toLowerCase();
  const bySlug = categories.find((c) => c.slug === normalized);
  if (bySlug) return { name: bySlug.name, slug: bySlug.slug };
  const byName = categories.find((c) => c.name.toLowerCase() === normalized);
  if (byName) return { name: byName.name, slug: byName.slug };
  return null;
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
  const detail = catalogProduct.detail ?? buildDefaultDetail(catalogProduct, []);

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

export async function getAllProducts(
  includeInactive = false
): Promise<CatalogProduct[]> {
  return fetchAllProducts(includeInactive);
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
  const products = await fetchProductsByCategory(categorySlug);
  return products.map(toProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await fetchAllProducts();
  return products.filter((p) => p.featured).map(toProduct);
}

export async function getTrendingProducts(): Promise<Product[]> {
  const products = await fetchAllProducts();
  return products.filter((p) => p.trending).map(toProduct);
}

export async function getNewArrivals(): Promise<Product[]> {
  const products = await fetchAllProducts();
  return products.filter((p) => p.newArrival).map(toProduct);
}

export async function getRelatedProducts(
  slug: string,
  limit = 4
): Promise<Product[]> {
  const product = await getCatalogProductBySlug(slug);
  if (!product) return [];

  const all = await fetchAllProducts();
  const relatedIds = product.detail?.relatedProductIds ?? [];
  const idMap = new Map(all.map((p) => [p.id, p]));

  const fromIds = relatedIds
    .map((id) => idMap.get(id))
    .filter((p): p is CatalogProduct => Boolean(p && p.status === "active"))
    .slice(0, limit)
    .map(toProduct);

  if (fromIds.length >= limit) return fromIds;

  const fallback = all
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

export async function searchProducts(
  options: ProductSearchOptions = {}
): Promise<Product[]> {
  let source = await fetchAllProducts(options.includeInactive ?? false);

  if (options.category) {
    source = await fetchProductsByCategory(
      options.category,
      options.includeInactive ?? false
    );
  }

  if (options.query) {
    const normalized = options.query.trim().toLowerCase();
    source = source.filter((p) => {
      const product = toProduct(p);
      return matchesQuery(product, normalized);
    });
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

export async function getBrands(): Promise<Brand[]> {
  return fetchBrands();
}

export async function getCategories(): Promise<Category[]> {
  const categories = await fetchCategories();
  const products = await fetchAllProducts(true);
  return categories.map((category) => ({
    ...category,
    productCount: products.filter(
      (p) => p.categorySlug === category.slug && p.status === "active"
    ).length,
  }));
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | undefined> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug);
}

export async function getProductSummaries(ids: string[]): Promise<Product[]> {
  const all = await fetchAllProducts(true);
  const idMap = new Map(all.map((p) => [p.id, p]));
  return ids
    .map((id) => idMap.get(id))
    .filter((p): p is CatalogProduct => Boolean(p && p.status === "active"))
    .map(toProduct);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const products = await fetchAllProducts();
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

  const all = await fetchAllProducts(true);
  product.detail = buildDefaultDetail(product, all);
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

  if (patch.slug && patch.slug !== current.slug) {
    if (await slugExists(patch.slug, id)) throw new Error("Slug already exists");
  }

  if (patch.sku && patch.sku !== current.sku) {
    if (await skuExists(patch.sku, id)) throw new Error("SKU already exists");
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
    availability: patch.availability ?? stockToAvailability(stock),
    brandSlug:
      patch.brandSlug ??
      (patch.brand ? slugify(patch.brand) : current.brandSlug),
    updatedAt: now,
  };

  if (patch.images?.length) {
    updated.image = patch.images[0];
    updated.images = patch.images;
  }

  const all = await fetchAllProducts(true);
  updated.detail = buildDefaultDetail(updated, all);
  return writeProduct(updated, id);
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
  }

  return {
    imported: importedProducts.length,
    skipped: failedRows.length,
    errors: failedRows.length,
    failedRows,
    products: importedProducts,
  };
}

export type CatalogDataSource = "firestore" | "postgres";

export { batchWriteProducts };
