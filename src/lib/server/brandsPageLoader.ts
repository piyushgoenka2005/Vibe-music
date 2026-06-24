import "server-only";

import { cache } from "react";
import { getAllProducts, getBrands } from "@/services/catalogService";
import type { Brand } from "@/types/brand";

export interface BrandWithCount extends Brand {
  productCount: number;
}

export const loadBrandsWithCounts = cache(async function loadBrandsWithCounts(): Promise<BrandWithCount[]> {
  const [brands, products] = await Promise.all([
    getBrands(),
    getAllProducts(false),
  ]);

  const countBySlug = new Map<string, number>();
  for (const product of products) {
    if (product.status !== "active") continue;
    countBySlug.set(
      product.brandSlug,
      (countBySlug.get(product.brandSlug) ?? 0) + 1
    );
  }

  return brands
    .map((brand) => ({
      ...brand,
      productCount: countBySlug.get(brand.slug) ?? 0,
    }))
    .filter((brand) => brand.productCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
});
