import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import type { CatalogProduct, ProductStatus } from "@/types/catalog";
import type { DocumentData, Firestore } from "firebase-admin/firestore";

const PRODUCTS = "products";
const CATEGORIES = "categories";
const BRANDS = "brands";

const CACHE_TTL_MS = 45_000;

let productsCache: CatalogProduct[] | null = null;
let productsCacheAt = 0;
let categoriesCache: Category[] | null = null;
let categoriesCacheAt = 0;

function db(): Firestore {
  return getAdminFirestore();
}

export function invalidateCatalogCache(): void {
  productsCache = null;
  productsCacheAt = 0;
  categoriesCache = null;
  categoriesCacheAt = 0;
}

function isFresh(ts: number): boolean {
  return Date.now() - ts < CACHE_TTL_MS;
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
    categorySlug: str(data.categorySlug),
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
  if (productsCache && isFresh(productsCacheAt)) {
    return includeInactive
      ? productsCache
      : productsCache.filter((p) => p.status === "active");
  }

  const snap = await db().collection(PRODUCTS).get();
  const products = snap.docs
    .map((doc) => docToCatalogProduct(doc.id, doc.data()))
    .filter((p): p is CatalogProduct => p !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  productsCache = products;
  productsCacheAt = Date.now();

  return includeInactive
    ? products
    : products.filter((p) => p.status === "active");
}

export async function fetchProductById(
  id: string
): Promise<CatalogProduct | null> {
  const cached = productsCache?.find((p) => p.id === id);
  if (cached) return cached;

  const doc = await db().collection(PRODUCTS).doc(id).get();
  if (!doc.exists) return null;
  return docToCatalogProduct(doc.id, doc.data()!);
}

export async function fetchProductBySlug(
  slug: string
): Promise<CatalogProduct | null> {
  const cached = productsCache?.find((p) => p.slug === slug);
  if (cached) return cached;

  const snap = await db()
    .collection(PRODUCTS)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return docToCatalogProduct(doc.id, doc.data());
}

export async function fetchProductsByCategory(
  categorySlug: string,
  includeInactive = false
): Promise<CatalogProduct[]> {
  try {
    let query = db()
      .collection(PRODUCTS)
      .where("categorySlug", "==", categorySlug);

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
  } catch {
    const all = await fetchAllProducts(includeInactive);
    return all.filter((p) => p.categorySlug === categorySlug);
  }
}

export async function fetchCategories(): Promise<Category[]> {
  if (categoriesCache && isFresh(categoriesCacheAt)) {
    return categoriesCache;
  }

  const snap = await db().collection(CATEGORIES).get();
  if (snap.empty) {
    const { loadCategories } = await import("@/lib/server/catalogRepository");
    categoriesCache = loadCategories();
    categoriesCacheAt = Date.now();
    return categoriesCache;
  }

  const categories = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: str(data.name),
      slug: str(data.slug),
      description: data.description ? str(data.description) : undefined,
    } satisfies Category;
  });

  categoriesCache = categories;
  categoriesCacheAt = Date.now();
  return categories;
}

export async function fetchBrands(): Promise<Brand[]> {
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
  } catch {
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
  const products = await fetchAllProducts(true);
  return {
    slugs: new Set(products.map((p) => p.slug)),
    skus: new Set(products.map((p) => p.sku)),
  };
}
