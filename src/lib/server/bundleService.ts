import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { getProductById, getProductSummaries } from "@/services/catalogService";
import { toProduct } from "@/services/catalogService";
import type {
  ProductBundle,
  ResolvedProductBundle,
  UpsertProductBundleInput,
} from "@/types/bundle";
import { DEFAULT_BUNDLE_DISCOUNT_PERCENT } from "@/types/bundle";

const COLLECTION = "product_bundles";

const CACHE_TTL_MS = 45_000;

let bundleCache: Map<string, ProductBundle | null> | null = null;
let bundleCacheAt = 0;

function now(): string {
  return new Date().toISOString();
}

function isFresh(ts: number): boolean {
  return Date.now() - ts < CACHE_TTL_MS;
}

export function invalidateBundleCache(): void {
  bundleCache = null;
  bundleCacheAt = 0;
}

function normalizeBundle(
  id: string,
  data: FirebaseFirestore.DocumentData
): ProductBundle {
  const relatedProductIds = Array.isArray(data.relatedProductIds)
    ? (data.relatedProductIds as string[]).filter(Boolean)
    : [];

  return {
    id,
    productId: String(data.productId ?? id),
    productName: data.productName ? String(data.productName) : undefined,
    productSlug: data.productSlug ? String(data.productSlug) : undefined,
    relatedProductIds,
    discountPercent: Number(data.discountPercent ?? DEFAULT_BUNDLE_DISCOUNT_PERCENT),
    isActive: data.isActive !== false,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function getBundleByProductId(
  productId: string
): Promise<ProductBundle | null> {
  if (bundleCache && isFresh(bundleCacheAt) && bundleCache.has(productId)) {
    return bundleCache.get(productId) ?? null;
  }

  const doc = await getAdminFirestore()
    .collection(COLLECTION)
    .doc(productId)
    .get();

  const bundle = doc.exists ? normalizeBundle(doc.id, doc.data()!) : null;

  if (!bundleCache || !isFresh(bundleCacheAt)) {
    bundleCache = new Map();
    bundleCacheAt = Date.now();
  }
  bundleCache.set(productId, bundle);

  return bundle;
}

export async function listAllBundles(): Promise<ProductBundle[]> {
  const snap = await getAdminFirestore().collection(COLLECTION).get();
  return snap.docs
    .map((doc) => normalizeBundle(doc.id, doc.data()))
    .sort((a, b) => a.productName?.localeCompare(b.productName ?? "") ?? 0);
}

export async function upsertProductBundle(
  productId: string,
  input: UpsertProductBundleInput
): Promise<ProductBundle> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc(productId);
  const existing = await ref.get();
  const timestamp = now();

  const bundle: ProductBundle = {
    id: productId,
    productId,
    productName: input.productName,
    productSlug: input.productSlug,
    relatedProductIds: input.relatedProductIds.filter(Boolean),
    discountPercent: input.discountPercent ?? DEFAULT_BUNDLE_DISCOUNT_PERCENT,
    isActive: input.isActive ?? true,
    createdAt: existing.exists
      ? String(existing.data()?.createdAt ?? timestamp)
      : timestamp,
    updatedAt: timestamp,
  };

  await ref.set(bundle);
  invalidateBundleCache();
  return bundle;
}

export async function deleteProductBundle(productId: string): Promise<void> {
  await getAdminFirestore().collection(COLLECTION).doc(productId).delete();
  invalidateBundleCache();
}

async function seedBundleFromProductDetail(
  productId: string
): Promise<ProductBundle | null> {
  const product = await getProductById(productId);
  if (!product) return null;

  const relatedIds = product.detail?.frequentlyBoughtTogether ?? [];
  if (relatedIds.length === 0) return null;

  return upsertProductBundle(productId, {
    relatedProductIds: relatedIds,
    productName: product.name,
    productSlug: product.slug,
    discountPercent: DEFAULT_BUNDLE_DISCOUNT_PERCENT,
    isActive: true,
  });
}

export async function resolveBundleForProduct(
  productId: string,
  mainUnitPrice?: number
): Promise<ResolvedProductBundle | null> {
  let bundle = await getBundleByProductId(productId);

  if (!bundle) {
    bundle = await seedBundleFromProductDetail(productId);
  }

  if (!bundle || !bundle.isActive || bundle.relatedProductIds.length === 0) {
    return null;
  }

  const relatedProducts = await getProductSummaries(bundle.relatedProductIds);
  if (relatedProducts.length === 0) return null;

  const mainProduct = await getProductById(productId);
  const mainPrice = mainUnitPrice ?? (mainProduct ? toProduct(mainProduct).price : 0);
  const subtotal =
    mainPrice + relatedProducts.reduce((sum, product) => sum + product.price, 0);
  const discountMultiplier = 1 - bundle.discountPercent / 100;
  const bundlePrice = Math.round(subtotal * discountMultiplier * 100) / 100;
  const savings = Math.round((subtotal - bundlePrice) * 100) / 100;

  return {
    discountPercent: bundle.discountPercent,
    subtotal,
    bundlePrice,
    savings,
    items: relatedProducts,
  };
}

export async function resolveBundleBySlug(
  slug: string,
  mainUnitPrice?: number
): Promise<ResolvedProductBundle | null> {
  const { getCatalogProductBySlug } = await import("@/services/catalogService");
  const product = await getCatalogProductBySlug(slug);
  if (!product) return null;
  return resolveBundleForProduct(product.id, mainUnitPrice);
}
