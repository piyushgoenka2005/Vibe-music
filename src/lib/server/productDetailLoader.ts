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
  60;

const loadCachedProductCore = unstable_cache(
  async function loadCachedProductCore(
    normalizedSlug: string
  ): Promise<ProductDetail | null> {
    const product = await getProductDetailBySlug(normalizedSlug);
    return product ?? null;
  },
  ["product-detail-core"],
  {
    revalidate: PRODUCT_DETAIL_REVALIDATE_SECONDS,
    tags: ["catalog", "product-detail"],
  }
);

export const loadProductCorePage = cache(async function loadProductCorePage(
  slug: string
): Promise<ProductDetail | null> {
  const normalizedSlug = normalizeProductSlug(slug);
  if (!normalizedSlug) return null;
  return loadCachedProductCore(normalizedSlug);
});

const loadCachedProductMerchandising = unstable_cache(
  async function loadCachedProductMerchandising(
    product: ProductDetail
  ): Promise<Omit<ProductDetailResult, "product">> {
    const [bundle, similarProducts, relatedResult] = await Promise.all([
      resolveBundleForProduct(product.id, product.price),
      getProductSummaries(product.similarProductIds),
      resolveRelatedProductsForProduct(product.id, 8),
    ]);

    return {
      bundle,
      frequentlyBoughtTogether: bundle?.items ?? [],
      similarProducts,
      relatedProducts: relatedResult.products,
    };
  },
  ["product-detail-merchandising"],
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
    const result = await loadCachedProductMerchandising(product);

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
