import "server-only";

import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
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

function mapRelation(row: {
  id: string;
  productId: string;
  productName: string | null;
  productSlug: string | null;
  relatedProductIds: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}): ProductRelatedList {
  const relatedProductIds = Array.isArray(row.relatedProductIds)
    ? (row.relatedProductIds as string[]).filter(Boolean).slice(0, MAX_RELATED_PRODUCTS)
    : [];

  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName ?? undefined,
    productSlug: row.productSlug ?? undefined,
    relatedProductIds,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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

  const row = await prisma.productRelation.findUnique({ where: { productId } });
  const relation = row ? mapRelation(row) : null;

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
  const existing = await prisma.productRelation.findUnique({ where: { productId } });
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
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await prisma.productRelation.upsert({
    where: { productId },
    create: {
      id: productId,
      productId,
      productName: relation.productName ?? null,
      productSlug: relation.productSlug ?? null,
      relatedProductIds: asJsonValue(relation.relatedProductIds),
      isActive: relation.isActive,
      createdAt: relation.createdAt,
      updatedAt: relation.updatedAt,
    },
    update: {
      productName: relation.productName ?? null,
      productSlug: relation.productSlug ?? null,
      relatedProductIds: asJsonValue(relation.relatedProductIds),
      isActive: relation.isActive,
      updatedAt: relation.updatedAt,
    },
  });

  invalidateRelatedProductsCache();
  return relation;
}

export async function deleteProductRelatedList(
  productId: string
): Promise<void> {
  await prisma.productRelation.delete({ where: { productId } });
  invalidateRelatedProductsCache();
}

function relationFromProductDetail(
  product: NonNullable<Awaited<ReturnType<typeof getProductById>>>
): ProductRelatedList | null {
  const relatedIds = product.detail?.relatedProductIds ?? [];
  if (relatedIds.length === 0) return null;

  return {
    id: product.id,
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    relatedProductIds: relatedIds.slice(0, MAX_RELATED_PRODUCTS),
    isActive: true,
    createdAt: "",
    updatedAt: "",
  };
}

async function seedRelationFromProductDetail(
  productId: string
): Promise<ProductRelatedList | null> {
  const product = await getProductById(productId);
  if (!product) return null;

  const fromDetail = relationFromProductDetail(product);
  if (!fromDetail) return null;

  return upsertProductRelatedList(productId, {
    relatedProductIds: fromDetail.relatedProductIds,
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
    const categoryProducts = await fetchProductsByCategory(product.categorySlug);
    resolved = appendUniqueProducts(
      resolved,
      categoryProducts.map(toProduct),
      seenIds,
      limit
    );
  }

  if (resolved.length < limit && product.brandSlug) {
    const brandProducts = await fetchProductsByBrandSlug(product.brandSlug);
    const filtered = brandProducts.filter((candidate) => candidate.id !== product.id);
    resolved = appendUniqueProducts(
      resolved,
      filtered.map(toProduct),
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
