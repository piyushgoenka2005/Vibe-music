import "server-only";

import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  findCategoryInList,
  normalizeCategoryRecord,
  normalizeCategorySlug,
} from "@/lib/categorySlug";
import { slugify, normalizeProductSlug } from "@/lib/slug";
import {
  createFirestoreCircuitBreaker,
  isFirestoreFastFailError,
  isFirestoreUnavailableError,
  logFirestoreWarning,
  markFirestoreUnavailable,
  withFirestoreDeadline,
} from "@/lib/server/firestoreErrors";
import { createFirestoreCache } from "@/lib/server/firestoreCache";
import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import type { CatalogProduct, ProductStatus } from "@/types/catalog";
import type { DocumentData, Firestore, Query } from "firebase-admin/firestore";

const PRODUCTS = "products";
const CATEGORIES = "categories";
const BRANDS = "brands";

const catalogCircuit = createFirestoreCircuitBreaker();

const productsCache = createFirestoreCache<CatalogProduct[]>({
  namespace: "catalog:products",
  ttlMs:
    Number(process.env.CATALOG_MEMORY_CACHE_TTL_MS) ||
    (process.env.NODE_ENV === "production" ? 300_000 : 90_000),
  maxEntries: 1,
});

const categoriesCache = createFirestoreCache<Category[]>({
  namespace: "catalog:categories",
  ttlMs:
    Number(process.env.CATALOG_MEMORY_CACHE_TTL_MS) ||
    (process.env.NODE_ENV === "production" ? 300_000 : 90_000),
  maxEntries: 1,
});

const productBySlugCache = createFirestoreCache<CatalogProduct>({
  namespace: "catalog:product-by-slug",
  ttlMs: 600_000,
  maxEntries: 500,
});

const productByIdCache = createFirestoreCache<CatalogProduct>({
  namespace: "catalog:product-by-id",
  ttlMs: 600_000,
  maxEntries: 500,
});

function isCatalogFirestoreDisabled(): boolean {
  return process.env.DISABLE_FIRESTORE_CATALOG === "true";
}

function shouldUseLocalCatalog(): boolean {
  return isCatalogFirestoreDisabled() || !isFirebaseAdminConfigured();
}

let catalogSeedPromise: Promise<void> | null = null;

async function ensureCatalogSeeded(): Promise<void> {
  if (shouldUseLocalCatalog()) return;
  if (catalogSeedPromise) return catalogSeedPromise;

  catalogSeedPromise = (async () => {
    const { isCatalogEmpty, seedCatalogFromJson } = await import(
      "@/lib/server/catalogSeed"
    );
    if (!(await isCatalogEmpty())) return;

    const result = await seedCatalogFromJson();
    invalidateCatalogCache();
    logCatalogWarning(
      new Error("bootstrap"),
      `Seeded Firestore catalog from JSON (${result.products} products, ${result.categories} categories, ${result.brands} brands)`
    );
  })().catch((error) => {
    catalogSeedPromise = null;
    throw error;
  });

  return catalogSeedPromise;
}

function filterActiveProducts(
  products: CatalogProduct[],
  includeInactive: boolean
): CatalogProduct[] {
  return includeInactive
    ? products
    : products.filter((p) => p.status === "active");
}

async function loadLocalCatalogProducts(): Promise<CatalogProduct[]> {
  const { loadProducts } = await import("@/lib/server/catalogRepository");
  return loadProducts();
}

async function loadLocalCategories(): Promise<Category[]> {
  const { loadCategories } = await import("@/lib/server/catalogRepository");
  return loadCategories();
}

function sortProducts(products: CatalogProduct[]): CatalogProduct[] {
  return [...products].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function localProductsFiltered(includeInactive: boolean): Promise<CatalogProduct[]> {
  return loadLocalCatalogProducts().then((products) =>
    filterActiveProducts(sortProducts(products), includeInactive)
  );
}

function cachedProducts(includeInactive: boolean): CatalogProduct[] | null {
  const cached = productsCache.get("all");
  if (!cached) return null;
  return filterActiveProducts(cached, includeInactive);
}

function logCatalogWarning(error: unknown, context: string): void {
  logFirestoreWarning("catalog", error, context);
}

function handleCatalogUnavailable<T>(
  error: unknown,
  context: string,
  fallback: T
): T {
  if (isFirestoreUnavailableError(error) || isFirestoreFastFailError(error)) {
    markFirestoreUnavailable(error);
    const wasOpen = catalogCircuit.isOpen();
    catalogCircuit.open();
    if (!wasOpen) {
      logCatalogWarning(error, context);
    }
    return fallback;
  }
  throw error;
}

export function isCatalogUnavailable(): boolean {
  return shouldUseLocalCatalog() || catalogCircuit.isOpen();
}

function db(): Firestore {
  return getAdminFirestore();
}

export function invalidateCatalogCache(): void {
  productsCache.clear();
  categoriesCache.clear();
  productBySlugCache.clear();
  productByIdCache.clear();
  void import("@/lib/server/catalogSnapshotCache").then(({ revalidateCatalogSnapshot }) =>
    revalidateCatalogSnapshot()
  );
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown, fallback = ""): string {
  return value != null ? String(value) : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return fallback;
}

export function docToCatalogProduct(
  id: string,
  data: DocumentData
): CatalogProduct | null {
  if (!data.name || !data.slug || !data.brand) return null;

  const images = Array.isArray(data.images)
    ? (data.images as string[]).filter(Boolean)
    : data.image
      ? [String(data.image)]
      : [];

  const primaryImage = images[0] ?? str(data.image, "/images/placeholder.png");

  return {
    id,
    slug: str(data.slug),
    name: str(data.name),
    brand: str(data.brand),
    category: str(data.category),
    subcategory: str(data.subcategory),
    price: num(data.price),
    originalPrice: num(data.originalPrice, num(data.price)),
    discountPercentage: num(data.discountPercentage),
    rating: num(data.rating),
    reviewCount: num(data.reviewCount),
    stock: num(data.stock, 100),
    reservedStock: num(data.reservedStock, 0),
    lowStockThreshold: num(data.lowStockThreshold, 10),
    sku: str(data.sku),
    status: (data.status as ProductStatus) ?? "active",
    featured: bool(data.featured),
    trending: bool(data.trending),
    newArrival: bool(data.newArrival),
    images: images.length ? images : [primaryImage],
    description: str(data.description),
    specifications: (data.specifications as Record<string, string>) ?? {},
    createdAt: str(data.createdAt, new Date().toISOString()),
    updatedAt: str(data.updatedAt, new Date().toISOString()),
    brandSlug: str(data.brandSlug),
    categorySlug: normalizeCategorySlug(str(data.categorySlug)),
    availability: data.availability ?? "in-stock",
    condition: data.condition ?? "new",
    imageColor: str(data.imageColor, "#e8e8e8"),
    image: primaryImage,
    gstRate: data.gstRate,
    detail: data.detail,
  };
}

export function catalogProductToDoc(product: CatalogProduct): DocumentData {
  return {
    ...product,
    stockQuantity: product.stock,
    reservedStock: product.reservedStock ?? 0,
    lowStockThreshold: product.lowStockThreshold ?? 10,
  };
}

export async function fetchAllProducts(
  includeInactive = false
): Promise<CatalogProduct[]> {
  if (shouldUseLocalCatalog()) {
    return localProductsFiltered(includeInactive);
  }

  if (catalogCircuit.isOpen()) {
    const cached = cachedProducts(includeInactive);
    if (cached?.length) return cached;
    return localProductsFiltered(includeInactive);
  }

  const cached = productsCache.get("all");
  if (cached) {
    return filterActiveProducts(cached, includeInactive);
  }

  try {
    await ensureCatalogSeeded();

    const snap = await withFirestoreDeadline(() =>
      db().collection(PRODUCTS).get()
    );

    const products = sortProducts(
      snap.docs
        .map((doc) => docToCatalogProduct(doc.id, doc.data()))
        .filter((p): p is CatalogProduct => p !== null)
    );

    productsCache.set("all", products);

    for (const product of products) {
      productByIdCache.set(product.id, product);
      productBySlugCache.set(product.slug, product);
    }

    return filterActiveProducts(products, includeInactive);
  } catch (error) {
    const cached = cachedProducts(includeInactive);
    if (cached?.length) return cached;

    return handleCatalogUnavailable(
      error,
      "Unable to fetch products from Firestore",
      await localProductsFiltered(includeInactive)
    );
  }
}

export interface ProductsPageResult {
  products: CatalogProduct[];
  hasMore: boolean;
  nextCursor?: string;
}

export async function fetchProductsPage(options: {
  limit?: number;
  cursor?: string;
  includeInactive?: boolean;
  status?: ProductStatus;
  categorySlug?: string;
}): Promise<ProductsPageResult> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const includeInactive = options.includeInactive ?? false;

  if (shouldUseLocalCatalog()) {
    const { paginateSortedById } = await import("@/lib/admin/paginateByCursor");
    let products = await localProductsFiltered(includeInactive);

    if (options.categorySlug) {
      const categories = await loadLocalCategories();
      const category = findCategoryInList(categories, options.categorySlug);
      const resolvedSlug =
        category?.slug ?? normalizeCategorySlug(options.categorySlug);
      products = products.filter(
        (p) => normalizeCategorySlug(p.categorySlug) === resolvedSlug
      );
    }

    if (options.status) {
      products = products.filter((p) => p.status === options.status);
    } else if (!includeInactive) {
      products = products.filter((p) => p.status === "active");
    }

    products.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const page = paginateSortedById(products, {
      limit,
      cursor: options.cursor,
    });

    return {
      products: page.items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    };
  }

  if (catalogCircuit.isOpen()) {
    const { paginateSortedById } = await import("@/lib/admin/paginateByCursor");
    let products = cachedProducts(includeInactive) ?? [];
    if (options.categorySlug) {
      const resolvedSlug = normalizeCategorySlug(options.categorySlug);
      products = products.filter(
        (p) => normalizeCategorySlug(p.categorySlug) === resolvedSlug
      );
    }
    if (options.status) {
      products = products.filter((p) => p.status === options.status);
    }
    const page = paginateSortedById(products, { limit, cursor: options.cursor });
    return {
      products: page.items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    };
  }

  try {
    await ensureCatalogSeeded();

    let query: Query = db().collection(PRODUCTS);

    if (options.categorySlug) {
      const categories = await fetchCategories();
      const category = findCategoryInList(categories, options.categorySlug);
      const resolvedSlug =
        category?.slug ?? normalizeCategorySlug(options.categorySlug);
      query = query.where("categorySlug", "==", resolvedSlug);
    }

    if (options.status) {
      query = query.where("status", "==", options.status);
    } else if (!includeInactive) {
      query = query.where("status", "==", "active");
    }

    query = query.orderBy("createdAt", "desc");

    if (options.cursor) {
      const cursorDoc = await db().collection(PRODUCTS).doc(options.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await withFirestoreDeadline(() => query.limit(limit + 1).get());
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = docs.slice(0, limit);

    const products = pageDocs
      .map((doc) => docToCatalogProduct(doc.id, doc.data()))
      .filter((p): p is CatalogProduct => p !== null);

    for (const product of products) {
      upsertProductsCacheEntry(product);
    }

    return {
      products,
      hasMore,
      nextCursor:
        hasMore && pageDocs.length > 0
          ? pageDocs[pageDocs.length - 1]!.id
          : undefined,
    };
  } catch (error) {
    const { paginateSortedById } = await import("@/lib/admin/paginateByCursor");
    const fallback = cachedProducts(includeInactive) ?? [];
    const page = paginateSortedById(fallback, { limit, cursor: options.cursor });
    if (page.items.length > 0) {
      return {
        products: page.items,
        hasMore: page.hasMore,
        nextCursor: page.nextCursor,
      };
    }

    return handleCatalogUnavailable(error, "Unable to fetch products page", {
      products: [],
      hasMore: false,
    });
  }
}

export async function fetchProductById(
  id: string
): Promise<CatalogProduct | null> {
  if (shouldUseLocalCatalog()) {
    const local = await loadLocalCatalogProducts();
    return local.find((p) => p.id === id) ?? null;
  }

  const cached = productByIdCache.get(id);
  if (cached) return cached;

  if (catalogCircuit.isOpen()) {
    const fromAll = productsCache.get("all")?.find((p) => p.id === id) ?? null;
    if (fromAll) return fromAll;
    return productByIdCache.get(id) ?? null;
  }

  try {
    await ensureCatalogSeeded();
    const doc = await db().collection(PRODUCTS).doc(id).get();
    if (!doc.exists) return null;
    const product = docToCatalogProduct(doc.id, doc.data()!);
    if (product) {
      productByIdCache.set(product.id, product);
    }
    return product;
  } catch (error) {
    return handleCatalogUnavailable(
      error,
      `Unable to fetch product ${id}`,
      productsCache.get("all")?.find((p) => p.id === id) ?? null
    );
  }
}

function productMatchesSlug(product: CatalogProduct, slug: string): boolean {
  const normalized = normalizeProductSlug(slug);
  const productSlug = normalizeProductSlug(product.slug);
  return productSlug === normalized || product.slug === slug.trim();
}

function upsertProductsCacheEntry(product: CatalogProduct): void {
  const existing = productsCache.get("all");
  if (existing) {
    const index = existing.findIndex((entry) => entry.id === product.id);
    if (index >= 0) {
      existing[index] = product;
    } else {
      existing.push(product);
    }
    productsCache.set("all", existing);
  }
  productByIdCache.set(product.id, product);
  productBySlugCache.set(product.slug, product);
}

async function queryActiveProductBySlugFromFirestore(
  slug: string
): Promise<CatalogProduct | null> {
  const normalized = normalizeProductSlug(slug);
  const candidates = [...new Set([slug.trim(), normalized].filter(Boolean))];

  for (const candidate of candidates) {
    const snap = await withFirestoreDeadline(() =>
      db().collection(PRODUCTS).where("slug", "==", candidate).limit(1).get()
    );

    if (snap.empty) continue;

    const doc = snap.docs[0]!;
    const product = docToCatalogProduct(doc.id, doc.data());
    if (!product) continue;

    upsertProductsCacheEntry(product);
    return product.status === "active" ? product : null;
  }

  return null;
}

export async function fetchProductBySlug(
  slug: string
): Promise<CatalogProduct | null> {
  const normalizedSlug = normalizeProductSlug(slug);
  if (!normalizedSlug) return null;

  if (shouldUseLocalCatalog()) {
    const local = await loadLocalCatalogProducts();
    const hit = local.find((product) => productMatchesSlug(product, normalizedSlug));
    return hit && hit.status === "active" ? hit : null;
  }

  const fromSlugCache = productBySlugCache.get(normalizedSlug);
  if (fromSlugCache?.status === "active") return fromSlugCache;

  const cached = productsCache.get("all");
  const fromAllCache = cached?.find(
    (product) =>
      productMatchesSlug(product, normalizedSlug) && product.status === "active"
  );
  if (fromAllCache) {
    productBySlugCache.set(normalizedSlug, fromAllCache);
    return fromAllCache;
  }

  if (catalogCircuit.isOpen()) {
    const cachedAll = productsCache.get("all");
    const hit = cachedAll?.find(
      (product) =>
        productMatchesSlug(product, normalizedSlug) && product.status === "active"
    );
    if (hit) return hit;
    const local = await loadLocalCatalogProducts();
    const localHit = local.find((product) => productMatchesSlug(product, normalizedSlug));
    return localHit && localHit.status === "active" ? localHit : null;
  }

  try {
    await ensureCatalogSeeded();

    const firestoreHit = await queryActiveProductBySlugFromFirestore(normalizedSlug);
    if (firestoreHit) {
      productBySlugCache.set(normalizedSlug, firestoreHit);
      productByIdCache.set(firestoreHit.id, firestoreHit);
      return firestoreHit;
    }

    return null;
  } catch (error) {
    const cachedAll = productsCache.get("all");
    const hit = cachedAll?.find(
      (product) =>
        productMatchesSlug(product, normalizedSlug) && product.status === "active"
    );
    if (hit) return hit;

    const local = await loadLocalCatalogProducts();
    const localHit = local.find((product) => productMatchesSlug(product, normalizedSlug));
    return handleCatalogUnavailable(
      error,
      `Unable to fetch product by slug ${normalizedSlug}`,
      localHit && localHit.status === "active" ? localHit : null
    );
  }
}

export async function fetchProductsByCategory(
  categorySlug: string,
  includeInactive = false
): Promise<CatalogProduct[]> {
  const categories = await fetchCategories();
  const category = findCategoryInList(categories, categorySlug);
  const resolvedSlug =
    category?.slug ?? normalizeCategorySlug(categorySlug);

  const matchesCategory = (product: CatalogProduct) =>
    normalizeCategorySlug(product.categorySlug) === resolvedSlug;

  if (shouldUseLocalCatalog()) {
    const local = await localProductsFiltered(includeInactive);
    return local.filter(matchesCategory);
  }

  if (catalogCircuit.isOpen()) {
    const cached = cachedProducts(includeInactive);
    if (cached?.length) {
      return cached.filter(matchesCategory);
    }
    const local = await localProductsFiltered(includeInactive);
    return local.filter(matchesCategory);
  }

  const cached = productsCache.get("all");
  if (cached) {
    const fromCache = filterActiveProducts(cached, includeInactive).filter(matchesCategory);
    if (fromCache.length > 0) {
      const sorted = fromCache.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return sorted;
    }
  }

  try {
    await ensureCatalogSeeded();
    let query = db()
      .collection(PRODUCTS)
      .where("categorySlug", "==", resolvedSlug);

    if (!includeInactive) {
      query = query.where("status", "==", "active");
    }

    const snap = await query.get();
    return snap.docs
      .map((doc) => docToCatalogProduct(doc.id, doc.data()))
      .filter((p): p is CatalogProduct => p !== null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return handleCatalogUnavailable(
        error,
        `Unable to fetch products for category ${resolvedSlug}`,
        cachedProducts(includeInactive)?.filter(matchesCategory) ?? []
      );
    }

    const all = await fetchAllProducts(includeInactive);
    return all.filter(matchesCategory);
  }
}

export async function fetchCategories(): Promise<Category[]> {
  if (shouldUseLocalCatalog()) {
    return loadLocalCategories();
  }

  const cached = categoriesCache.get("all");
  if (cached) return cached;

  if (catalogCircuit.isOpen()) {
    const cachedOpen = categoriesCache.get("all");
    if (cachedOpen) return cachedOpen;
    return loadLocalCategories();
  }

  try {
    await ensureCatalogSeeded();
    const snap = await db().collection(CATEGORIES).get();

    const categories = snap.docs.map((doc) => {
      const data = doc.data();
      const rawSlug = str(data.slug) || slugify(str(data.name));
      return normalizeCategoryRecord({
        id: doc.id,
        name: str(data.name),
        slug: rawSlug,
        description: data.description ? str(data.description) : undefined,
        isFeatured: data.isFeatured === true,
        sortOrder:
          typeof data.sortOrder === "number" ? data.sortOrder : undefined,
      });
    });

    categoriesCache.set("all", categories);
    return categories;
  } catch (error) {
    const cachedError = categoriesCache.get("all");
    if (cachedError) {
      return handleCatalogUnavailable(
        error,
        "Unable to fetch categories",
        cachedError
      );
    }
    return handleCatalogUnavailable(
      error,
      "Unable to fetch categories",
      await loadLocalCategories()
    );
  }
}

export async function fetchBrands(): Promise<Brand[]> {
  if (shouldUseLocalCatalog()) {
    const products = await localProductsFiltered(false);
    const map = new Map<string, Brand>();
    products.forEach((p) => {
      if (!map.has(p.brandSlug)) {
        map.set(p.brandSlug, { id: p.brandSlug, name: p.brand, slug: p.brandSlug });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  if (catalogCircuit.isOpen()) {
    const cached = cachedProducts(false);
    const map = new Map<string, Brand>();
    (cached ?? []).forEach((p) => {
      if (!map.has(p.brandSlug)) {
        map.set(p.brandSlug, { id: p.brandSlug, name: p.brand, slug: p.brandSlug });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  try {
    await ensureCatalogSeeded();
    const snap = await db().collection(BRANDS).get();
    if (!snap.empty) {
      return snap.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: str(data.name),
            slug: str(data.slug),
          } satisfies Brand;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const products = await fetchAllProducts();
    const map = new Map<string, Brand>();
    products.forEach((p) => {
      if (!map.has(p.brandSlug)) {
        map.set(p.brandSlug, { id: p.brandSlug, name: p.brand, slug: p.brandSlug });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    return handleCatalogUnavailable(error, "Unable to fetch brands", []);
  }
}

const MAX_FETCH_DEFAULT = 12;

export async function fetchProductsByBrandSlug(
  brandSlug: string,
  options: {
    excludeProductId?: string;
    excludeSlug?: string;
    limit?: number;
  } = {}
): Promise<CatalogProduct[]> {
  const limit = options.limit ?? MAX_FETCH_DEFAULT;

  if (shouldUseLocalCatalog()) {
    const local = await localProductsFiltered(false);
    return local
      .filter(
        (product) =>
          product.brandSlug === brandSlug &&
          product.id !== options.excludeProductId &&
          product.slug !== options.excludeSlug
      )
      .slice(0, limit);
  }

  if (catalogCircuit.isOpen()) {
    const cached = cachedProducts(false);
    return (cached ?? [])
      .filter(
        (product) =>
          product.brandSlug === brandSlug &&
          product.id !== options.excludeProductId &&
          product.slug !== options.excludeSlug
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  }

  try {
    const snap = await db()
      .collection(PRODUCTS)
      .where("brandSlug", "==", brandSlug)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .limit(limit + 4)
      .get();

    return snap.docs
      .map((doc) => docToCatalogProduct(doc.id, doc.data()))
      .filter((product): product is CatalogProduct => {
        if (!product) return false;
        if (options.excludeProductId && product.id === options.excludeProductId) {
          return false;
        }
        if (options.excludeSlug && product.slug === options.excludeSlug) {
          return false;
        }
        return true;
      })
      .slice(0, limit);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return handleCatalogUnavailable(
        error,
        `Unable to fetch products for brand ${brandSlug}`,
        []
      );
    }

    const all = await fetchAllProducts();
    return all
      .filter(
        (product) =>
          product.brandSlug === brandSlug &&
          product.status === "active" &&
          product.id !== options.excludeProductId &&
          product.slug !== options.excludeSlug
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  }
}

export async function fetchProductsByIds(
  ids: string[],
  includeInactive = false
): Promise<CatalogProduct[]> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  if (shouldUseLocalCatalog()) {
    const local = await localProductsFiltered(includeInactive);
    return uniqueIds
      .map((id) => local.find((product) => product.id === id))
      .filter((product): product is CatalogProduct => Boolean(product));
  }

  if (catalogCircuit.isOpen()) {
    const cached = cachedProducts(includeInactive);
    if (!cached) return [];
    const byId = new Map(cached.map((p) => [p.id, p]));
    return uniqueIds
      .map((id) => byId.get(id))
      .filter((product): product is CatalogProduct => Boolean(product));
  }

  try {
    const firestore = db();
    const refs = uniqueIds.map((id) => firestore.collection(PRODUCTS).doc(id));
    const snaps = await firestore.getAll(...refs);

    const byId = new Map<string, CatalogProduct>();
    snaps.forEach((doc) => {
      if (!doc.exists) return;
      const product = docToCatalogProduct(doc.id, doc.data()!);
      if (!product) return;
      if (!includeInactive && product.status !== "active") return;
      byId.set(doc.id, product);
    });

    return uniqueIds
      .map((id) => byId.get(id))
      .filter((product): product is CatalogProduct => Boolean(product));
  } catch (error) {
    const cached = cachedProducts(includeInactive);
    const byId = cached ? new Map(cached.map((p) => [p.id, p])) : null;
    const fallback = byId
      ? uniqueIds
          .map((id) => byId.get(id))
          .filter((product): product is CatalogProduct => Boolean(product))
      : [];

    return handleCatalogUnavailable(
      error,
      "Unable to fetch products by ids",
      fallback
    );
  }
}

export async function writeProduct(
  product: CatalogProduct,
  docId?: string
): Promise<CatalogProduct> {
  const ref = docId
    ? db().collection(PRODUCTS).doc(docId)
    : db().collection(PRODUCTS).doc(product.id);

  await ref.set(catalogProductToDoc({ ...product, id: ref.id }), { merge: true });
  invalidateCatalogCache();
  return { ...product, id: ref.id };
}

export async function removeProduct(id: string): Promise<void> {
  await db().collection(PRODUCTS).doc(id).delete();
  invalidateCatalogCache();
}

export async function batchWriteProducts(products: CatalogProduct[]): Promise<number> {
  const firestore = db();
  let batch = firestore.batch();
  let count = 0;
  let ops = 0;

  for (const product of products) {
    const ref = firestore.collection(PRODUCTS).doc(product.id);
    batch.set(ref, catalogProductToDoc(product));
    ops += 1;
    count += 1;

    if (ops >= 400) {
      await batch.commit();
      batch = firestore.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  invalidateCatalogCache();
  return count;
}

export async function batchWriteCategories(categories: Category[]): Promise<void> {
  const firestore = db();
  const batch = firestore.batch();
  categories.forEach((cat) => {
    batch.set(firestore.collection(CATEGORIES).doc(cat.id), cat);
  });
  await batch.commit();
  invalidateCatalogCache();
}

export async function batchWriteBrands(brands: Brand[]): Promise<void> {
  const firestore = db();
  const batch = firestore.batch();
  brands.forEach((brand) => {
    batch.set(firestore.collection(BRANDS).doc(brand.id), brand);
  });
  await batch.commit();
}

export async function batchUpdateProducts(
  ids: string[],
  patch: Partial<CatalogProduct>
): Promise<number> {
  const firestore = db();
  const now = new Date().toISOString();
  let batch = firestore.batch();
  let ops = 0;
  let count = 0;

  for (const id of ids) {
    batch.update(firestore.collection(PRODUCTS).doc(id), {
      ...patch,
      updatedAt: now,
    });
    ops += 1;
    count += 1;
    if (ops >= 400) {
      await batch.commit();
      batch = firestore.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  invalidateCatalogCache();
  return count;
}

export async function batchDeleteProducts(ids: string[]): Promise<number> {
  const firestore = db();
  let batch = firestore.batch();
  let ops = 0;
  let count = 0;

  for (const id of ids) {
    batch.delete(firestore.collection(PRODUCTS).doc(id));
    ops += 1;
    count += 1;
    if (ops >= 400) {
      await batch.commit();
      batch = firestore.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  invalidateCatalogCache();
  return count;
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const snap = await db()
    .collection(PRODUCTS)
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (snap.empty) return false;
  if (excludeId && snap.docs[0].id === excludeId) return false;
  return true;
}

export async function skuExists(sku: string, excludeId?: string): Promise<boolean> {
  const snap = await db()
    .collection(PRODUCTS)
    .where("sku", "==", sku)
    .limit(1)
    .get();
  if (snap.empty) return false;
  if (excludeId && snap.docs[0].id === excludeId) return false;
  return true;
}

export async function fetchExistingSlugsAndSkus(): Promise<{
  slugs: Set<string>;
  skus: Set<string>;
}> {
  if (shouldUseLocalCatalog()) {
    const products = await localProductsFiltered(true);
    return {
      slugs: new Set(products.map((p) => p.slug)),
      skus: new Set(products.map((p) => p.sku)),
    };
  }

  const cached = productsCache.get("all");
  if (cached) {
    return {
      slugs: new Set(cached.map((p) => p.slug)),
      skus: new Set(cached.map((p) => p.sku)),
    };
  }

  if (catalogCircuit.isOpen()) {
    const cachedOpen = productsCache.get("all");
    if (cachedOpen) {
      return {
        slugs: new Set(cachedOpen.map((p) => p.slug)),
        skus: new Set(cachedOpen.map((p) => p.sku)),
      };
    }
    const fallback = await localProductsFiltered(true);
    return {
      slugs: new Set(fallback.map((p) => p.slug)),
      skus: new Set(fallback.map((p) => p.sku)),
    };
  }

  try {
    await ensureCatalogSeeded();
    const snap = await withFirestoreDeadline(() =>
      db()
        .collection(PRODUCTS)
        .select("slug", "sku")
        .get()
    );

    const slugs = new Set<string>();
    const skus = new Set<string>();
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const slug = str(data.slug);
      const sku = str(data.sku);
      if (slug) slugs.add(slug);
      if (sku) skus.add(sku);
    });

    return { slugs, skus };
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      markFirestoreUnavailable(error);
    }
    const fallback = await localProductsFiltered(true);
    return {
      slugs: new Set(fallback.map((p) => p.slug)),
      skus: new Set(fallback.map((p) => p.sku)),
    };
  }
}
