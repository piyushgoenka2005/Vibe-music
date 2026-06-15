import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  fetchProductsByBrandSlug,
  fetchProductsByCategory,
  fetchProductsByIds,
} from "@/lib/server/firestoreCatalogRepository";
import {
  getCatalogProductBySlug,
  getProductById,
  toProduct,
} from "@/services/catalogService";
import type { Product } from "@/types/product";
import {
  MAX_RELATED_PRODUCTS,
  type ProductRelatedList,
  type ResolvedRelatedProducts,
  type UpsertProductRelatedListInput,
} from "@/types/relatedProducts";

const COLLECTION = "product_relations";

const CACHE_TTL_MS = 45_000;

let relationsCache: Map<string, ProductRelatedList | null> | null = null;
let relationsCacheAt = 0;

function now(): string {
  return new Date().toISOString();
}

function isFresh(ts: number): boolean {
  return Date.now() - ts < CACHE_TTL_MS;
}

export function invalidateRelatedProductsCache(): void {
  relationsCache = null;
  relationsCacheAt = 0;
}

function normalizeRelation(
  id: string,
  data: FirebaseFirestore.DocumentData
): ProductRelatedList {
  const relatedProductIds = Array.isArray(data.relatedProductIds)
    ? (data.relatedProductIds as string[]).filter(Boolean).slice(0, MAX_RELATED_PRODUCTS)
    : [];

  return {
    id,
    productId: String(data.productId ?? id),
    productName: data.productName ? String(data.productName) : undefined,
    productSlug: data.productSlug ? String(data.productSlug) : undefined,
    relatedProductIds,
    isActive: data.isActive !== false,
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function getRelatedListByProductId(
  productId: string
): Promise<ProductRelatedList | null> {
  if (
    relationsCache &&
    isFresh(relationsCacheAt) &&
    relationsCache.has(productId)
  ) {
    return relationsCache.get(productId) ?? null;
  }

  const doc = await getAdminFirestore()
    .collection(COLLECTION)
    .doc(productId)
    .get();

  const relation = doc.exists ? normalizeRelation(doc.id, doc.data()!) : null;

  if (!relationsCache || !isFresh(relationsCacheAt)) {
    relationsCache = new Map();
    relationsCacheAt = Date.now();
  }
  relationsCache.set(productId, relation);

  return relation;
}

export async function upsertProductRelatedList(
  productId: string,
  input: UpsertProductRelatedListInput
): Promise<ProductRelatedList> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc(productId);
  const existing = await ref.get();
  const timestamp = now();

  const relation: ProductRelatedList = {
    id: productId,
    productId,
    productName: input.productName,
    productSlug: input.productSlug,
    relatedProductIds: input.relatedProductIds
      .filter(Boolean)
      .slice(0, MAX_RELATED_PRODUCTS),
    isActive: input.isActive ?? true,
    createdAt: existing.exists
      ? String(existing.data()?.createdAt ?? timestamp)
      : timestamp,
    updatedAt: timestamp,
  };

  await ref.set(relation);
  invalidateRelatedProductsCache();
  return relation;
}

export async function deleteProductRelatedList(
  productId: string
): Promise<void> {
  await getAdminFirestore().collection(COLLECTION).doc(productId).delete();
  invalidateRelatedProductsCache();
}

async function seedRelationFromProductDetail(
  productId: string
): Promise<ProductRelatedList | null> {
  const product = await getProductById(productId);
  if (!product) return null;

  const relatedIds = product.detail?.relatedProductIds ?? [];
  if (relatedIds.length === 0) return null;

  return upsertProductRelatedList(productId, {
    relatedProductIds: relatedIds.slice(0, MAX_RELATED_PRODUCTS),
    productName: product.name,
    productSlug: product.slug,
    isActive: true,
  });
}

function appendUniqueProducts(
  current: Product[],
  candidates: Product[],
  seenIds: Set<string>,
  limit: number
): Product[] {
  const next = [...current];
  for (const product of candidates) {
    if (next.length >= limit) break;
    if (seenIds.has(product.id)) continue;
    seenIds.add(product.id);
    next.push(product);
  }
  return next;
}

export async function resolveRelatedProductsForProduct(
  productId: string,
  limit = MAX_RELATED_PRODUCTS
): Promise<ResolvedRelatedProducts> {
  const product = await getProductById(productId);
  if (!product) {
    return { products: [], source: "fallback" };
  }

  let relation = await getRelatedListByProductId(productId);
  if (!relation) {
    relation = await seedRelationFromProductDetail(productId);
  }

  const manualIds =
    relation && relation.isActive ? relation.relatedProductIds : [];
  const seenIds = new Set<string>([productId]);

  let resolved: Product[] = [];
  let manualCount = 0;

  if (manualIds.length > 0) {
    const manualProducts = await fetchProductsByIds(manualIds);
    resolved = appendUniqueProducts(
      resolved,
      manualProducts.map(toProduct),
      seenIds,
      limit
    );
    manualCount = resolved.length;
  }

  if (resolved.length < limit && product.categorySlug) {
    const categoryProducts = await fetchProductsByCategory(
      product.categorySlug
    );
    resolved = appendUniqueProducts(
      resolved,
      categoryProducts.map(toProduct),
      seenIds,
      limit
    );
  }

  if (resolved.length < limit && product.brandSlug) {
    const brandProducts = await fetchProductsByBrandSlug(product.brandSlug, {
      excludeProductId: product.id,
      limit: limit - resolved.length + 4,
    });
    resolved = appendUniqueProducts(
      resolved,
      brandProducts.map(toProduct),
      seenIds,
      limit
    );
  }

  const source: ResolvedRelatedProducts["source"] =
    manualCount === 0
      ? "fallback"
      : manualCount >= resolved.length
        ? "manual"
        : "mixed";

  return { products: resolved.slice(0, limit), source };
}

export async function resolveRelatedProductsBySlug(
  slug: string,
  limit = MAX_RELATED_PRODUCTS
): Promise<ResolvedRelatedProducts> {
  const product = await getCatalogProductBySlug(slug);
  if (!product) {
    return { products: [], source: "fallback" };
  }
  return resolveRelatedProductsForProduct(product.id, limit);
}
