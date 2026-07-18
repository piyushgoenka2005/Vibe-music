import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { normalizeProductSlug } from "@/lib/slug";
import { resolveBundleForProduct } from "@/lib/server/bundleService";
import { resolveRelatedProductsForProduct } from "@/lib/server/relatedProductsService";
import {
  getProductDetailBySlug,
  getProductSummaries,
} from "@/services/catalogService";
import type { ProductDetailResult } from "@/services/product.service";
import type { ProductDetail } from "@/types/product";
import type { ResolvedProductBundle } from "@/types/bundle";

const PRODUCT_DETAIL_REVALIDATE_SECONDS =
  Number(process.env.PRODUCT_DETAIL_CACHE_REVALIDATE_SECONDS) ||
  Number(process.env.CATALOG_CACHE_REVALIDATE_SECONDS) ||
  300;

/**
 * Load PDP core data without caching misses.
 * `unstable_cache` must not wrap a function that returns `null` for missing
 * slugs — a transient miss would sticky-404 the product for the full
 * revalidate window (previously "This page hit a wrong note" for live SKUs).
 */
export const loadProductCorePage = cache(async function loadProductCorePage(
  slug: string
): Promise<ProductDetail | null> {
  const normalizedSlug = normalizeProductSlug(slug);
  if (!normalizedSlug) return null;

  try {
    return (await getProductDetailBySlug(normalizedSlug)) ?? null;
  } catch {
    return null;
  }
});

const loadCachedProductMerchandising = unstable_cache(
  async function loadCachedProductMerchandising(
    productId: string,
    productPrice: number,
    similarIdsKey: string
  ): Promise<Omit<ProductDetailResult, "product">> {
    const similarProductIds = similarIdsKey
      ? similarIdsKey.split("|").filter(Boolean)
      : [];

    const [bundle, similarProducts, relatedResult] = await Promise.all([
      resolveBundleForProduct(productId, productPrice),
      getProductSummaries(similarProductIds),
      resolveRelatedProductsForProduct(productId, 8),
    ]);

    return {
      bundle,
      frequentlyBoughtTogether: bundle?.items ?? [],
      similarProducts,
      relatedProducts: relatedResult.products,
    };
  },
  ["product-detail-merchandising-v3"],
  {
    revalidate: PRODUCT_DETAIL_REVALIDATE_SECONDS,
    tags: ["catalog", "product-detail", "product-merchandising"],
  }
);

export const loadProductMerchandising = cache(
  async function loadProductMerchandising(
    product: ProductDetail,
    initialBundle?: ResolvedProductBundle | null
  ): Promise<Omit<ProductDetailResult, "product">> {
    const similarIdsKey = (product.similarProductIds ?? []).join("|");
    const result = await loadCachedProductMerchandising(
      product.id,
      product.price,
      similarIdsKey
    );

    if (initialBundle) {
      return { ...result, bundle: initialBundle };
    }

    return result;
  }
);

export const loadProductDetailPage = cache(async function loadProductDetailPage(
  slug: string
): Promise<ProductDetailResult | null> {
  const product = await loadProductCorePage(slug);
  if (!product) return null;
  const merchandising = await loadProductMerchandising(product);
  return { product, ...merchandising };
});
