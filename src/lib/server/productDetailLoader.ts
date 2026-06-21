import "server-only";

import { cache } from "react";
import { normalizeProductSlug } from "@/lib/slug";
import { resolveBundleBySlug } from "@/lib/server/bundleService";
import {
  getProductDetailBySlug,
  getProductSummaries,
  getRelatedProducts,
} from "@/services/catalogService";
import type { ProductDetailResult } from "@/services/product.service";

export const loadProductDetailPage = cache(async function loadProductDetailPage(
  slug: string
): Promise<ProductDetailResult | null> {
  const normalizedSlug = normalizeProductSlug(slug);
  const product = await getProductDetailBySlug(normalizedSlug);
  if (!product) return null;

  const bundle = await resolveBundleBySlug(normalizedSlug);

  return {
    product,
    bundle,
    frequentlyBoughtTogether: bundle?.items ?? [],
    similarProducts: await getProductSummaries(product.similarProductIds),
    relatedProducts: await getRelatedProducts(normalizedSlug),
  };
});
