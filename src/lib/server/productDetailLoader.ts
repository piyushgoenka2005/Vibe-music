import "server-only";

import { cache } from "react";
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
  const product = await getProductDetailBySlug(slug);
  if (!product) return null;

  const bundle = await resolveBundleBySlug(slug);

  return {
    product,
    bundle,
    frequentlyBoughtTogether: bundle?.items ?? [],
    similarProducts: await getProductSummaries(product.similarProductIds),
    relatedProducts: await getRelatedProducts(slug),
  };
});
