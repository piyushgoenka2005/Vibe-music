import "server-only";

import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import { getProductById, getProductSummaries } from "@/services/catalogService";
import { toProduct } from "@/services/catalogService";
import type {
  ProductBundle,
  ResolvedProductBundle,
  UpsertProductBundleInput,
} from "@/types/bundle";
import { DEFAULT_BUNDLE_DISCOUNT_PERCENT } from "@/types/bundle";

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

function mapBundle(row: {
  id: string;
  productId: string;
  productName: string | null;
  productSlug: string | null;
  relatedProductIds: unknown;
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}): ProductBundle {
  const relatedProductIds = Array.isArray(row.relatedProductIds)
    ? (row.relatedProductIds as string[]).filter(Boolean)
    : [];

  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName ?? undefined,
    productSlug: row.productSlug ?? undefined,
    relatedProductIds,
    discountPercent: row.discountPercent,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getBundleByProductId(
  productId: string
): Promise<ProductBundle | null> {
  if (bundleCache && isFresh(bundleCacheAt) && bundleCache.has(productId)) {
    return bundleCache.get(productId) ?? null;
  }

  const row = await prisma.productBundle.findUnique({ where: { productId } });
  const bundle = row ? mapBundle(row) : null;

  if (!bundleCache || !isFresh(bundleCacheAt)) {
    bundleCache = new Map();
    bundleCacheAt = Date.now();
  }
  bundleCache.set(productId, bundle);

  return bundle;
}

export async function listAllBundles(): Promise<ProductBundle[]> {
  const rows = await prisma.productBundle.findMany();
  return rows
    .map(mapBundle)
    .sort((a, b) => a.productName?.localeCompare(b.productName ?? "") ?? 0);
}

export async function upsertProductBundle(
  productId: string,
  input: UpsertProductBundleInput
): Promise<ProductBundle> {
  const existing = await prisma.productBundle.findUnique({ where: { productId } });
  const timestamp = now();

  const bundle: ProductBundle = {
    id: productId,
    productId,
    productName: input.productName,
    productSlug: input.productSlug,
    relatedProductIds: input.relatedProductIds.filter(Boolean),
    discountPercent: input.discountPercent ?? DEFAULT_BUNDLE_DISCOUNT_PERCENT,
    isActive: input.isActive ?? true,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await prisma.productBundle.upsert({
    where: { productId },
    create: {
      id: productId,
      productId,
      productName: bundle.productName ?? null,
      productSlug: bundle.productSlug ?? null,
      relatedProductIds: asJsonValue(bundle.relatedProductIds),
      discountPercent: bundle.discountPercent,
      isActive: bundle.isActive,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
    },
    update: {
      productName: bundle.productName ?? null,
      productSlug: bundle.productSlug ?? null,
      relatedProductIds: asJsonValue(bundle.relatedProductIds),
      discountPercent: bundle.discountPercent,
      isActive: bundle.isActive,
      updatedAt: bundle.updatedAt,
    },
  });

  invalidateBundleCache();
  return bundle;
}

export async function deleteProductBundle(productId: string): Promise<void> {
  await prisma.productBundle.delete({ where: { productId } });
  invalidateBundleCache();
}

function bundleFromProductDetail(
  product: NonNullable<Awaited<ReturnType<typeof getProductById>>>
): ProductBundle | null {
  const relatedIds = product.detail?.frequentlyBoughtTogether ?? [];
  if (relatedIds.length === 0) return null;

  return {
    id: product.id,
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    relatedProductIds: relatedIds,
    discountPercent: DEFAULT_BUNDLE_DISCOUNT_PERCENT,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  };
}

async function seedBundleFromProductDetail(
  productId: string
): Promise<ProductBundle | null> {
  const product = await getProductById(productId);
  if (!product) return null;

  const fromDetail = bundleFromProductDetail(product);
  if (!fromDetail) return null;

  return upsertProductBundle(productId, {
    relatedProductIds: fromDetail.relatedProductIds,
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
