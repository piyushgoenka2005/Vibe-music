import "server-only";

import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import {
  fetchProductsByIds,
} from "@/lib/server/storeCatalogRepository";
import {
  getAllProducts,
  getCatalogProductBySlug,
  getProductById,
  toProduct,
} from "@/services/catalogService";
import type { CatalogProduct } from "@/types/catalog";
import {
  areMerchandisingPeersCompatible,
  rankMerchandisingPeers,
} from "@/lib/product/productRelevance";
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

  let relation: ProductRelatedList | null = null;
  try {
    const row = await prisma.productRelation.findUnique({
      where: { productId },
    });
    relation = row ? mapRelation(row) : null;
  } catch (error) {
    console.error("[related] getRelatedListByProductId failed", error);
    return null;
  }

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
  await prisma.productRelation.deleteMany({ where: { productId } });
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

async function loadMerchandisingCandidatePool(
  product: CatalogProduct
): Promise<CatalogProduct[]> {
  const snapshot = await getAllProducts(false);
  return snapshot.filter(
    (candidate) =>
      candidate.id !== product.id &&
      candidate.status === "active" &&
      candidate.price > 0 &&
      (candidate.categorySlug === product.categorySlug ||
        candidate.brandSlug === product.brandSlug)
  );
}

function resolveRankedFallbackProducts(
  product: CatalogProduct,
  candidates: CatalogProduct[],
  limit: number,
  mode: "similar" | "related",
  seenIds: Set<string>
): Product[] {
  const ranked = rankMerchandisingPeers(
    product,
    candidates,
    limit,
    mode,
    seenIds
  );
  return ranked.map(toProduct);
}

export async function resolveSimilarProductsForProduct(
  productId: string,
  configuredIds: string[] = [],
  limit = MAX_RELATED_PRODUCTS
): Promise<Product[]> {
  const product = await getProductById(productId);
  if (!product) return [];

  const seenIds = new Set<string>([productId]);
  let resolved: Product[] = [];

  if (configuredIds.length > 0) {
    const manualProducts = await fetchProductsByIds(configuredIds);
    const compatibleManual = manualProducts.filter((candidate) =>
      areMerchandisingPeersCompatible(product, candidate)
    );
    resolved = appendUniqueProducts(
      resolved,
      compatibleManual.map(toProduct),
      seenIds,
      limit
    );
  }

  if (resolved.length < limit) {
    const candidates = await loadMerchandisingCandidatePool(product);
    const fallback = resolveRankedFallbackProducts(
      product,
      candidates,
      limit - resolved.length,
      "similar",
      seenIds
    );
    resolved = appendUniqueProducts(resolved, fallback, seenIds, limit);
  }

  return resolved.slice(0, limit);
}

export async function resolveRelatedProductsForProduct(
  productId: string,
  limit = MAX_RELATED_PRODUCTS,
  excludeIds: string[] = []
): Promise<ResolvedRelatedProducts> {
  try {
    const product = await getProductById(productId);
    if (!product) {
      return { products: [], source: "fallback" };
    }

    let relation = await getRelatedListByProductId(productId);
    if (!relation) {
      try {
        relation = await seedRelationFromProductDetail(productId);
      } catch (error) {
        console.error("[related] seedRelationFromProductDetail failed", error);
        relation = null;
      }
    }

    const manualIds =
      relation && relation.isActive ? relation.relatedProductIds : [];
    const seenIds = new Set<string>([productId, ...excludeIds]);

    let resolved: Product[] = [];
    let manualCount = 0;

    if (manualIds.length > 0) {
      const manualProducts = await fetchProductsByIds(manualIds);
      const compatibleManual = manualProducts.filter((candidate) =>
        areMerchandisingPeersCompatible(product, candidate)
      );
      resolved = appendUniqueProducts(
        resolved,
        compatibleManual.map(toProduct),
        seenIds,
        limit
      );
      manualCount = resolved.length;
    }

    if (resolved.length < limit) {
      const candidates = await loadMerchandisingCandidatePool(product);
      const fallback = resolveRankedFallbackProducts(
        product,
        candidates,
        limit - resolved.length,
        "related",
        seenIds
      );
      resolved = appendUniqueProducts(resolved, fallback, seenIds, limit);
    }

    const source: ResolvedRelatedProducts["source"] =
      manualCount === 0
        ? "fallback"
        : manualCount >= resolved.length
          ? "manual"
          : "mixed";

    return { products: resolved.slice(0, limit), source };
  } catch (error) {
    console.error("[related] resolveRelatedProductsForProduct failed", error);
    return { products: [], source: "fallback" };
  }
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
