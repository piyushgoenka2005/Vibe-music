import "server-only";

import { cache } from "react";
import { normalizeCategorySlug } from "@/lib/categorySlug";
import { getCachedHomepageProducts } from "@/lib/server/catalogSnapshotCache";

export interface CategoryBentoCatalogMeta {
  brands?: string;
  productCount?: string;
}

function formatProductCountLabel(count: number): string | undefined {
  if (count <= 0) return undefined;
  if (count === 1) return "1 product";
  return `${count} products`;
}

/** Live category brands + counts from the Postgres catalog (not products.json). */
export const buildCategoryBentoCatalogMeta = cache(
  async (): Promise<Map<string, CategoryBentoCatalogMeta>> => {
    const products = await getCachedHomepageProducts();
    const bySlug = new Map<string, { brands: Set<string>; count: number }>();

    for (const product of products) {
      const slug = normalizeCategorySlug(product.categorySlug ?? product.category);
      const entry = bySlug.get(slug) ?? { brands: new Set<string>(), count: 0 };
      const brand = product.brand?.trim();
      if (brand) entry.brands.add(brand);
      entry.count += 1;
      bySlug.set(slug, entry);
    }

    const result = new Map<string, CategoryBentoCatalogMeta>();
    for (const [slug, entry] of bySlug) {
      const sortedBrands = [...entry.brands].sort((a, b) => a.localeCompare(b));
      result.set(slug, {
        brands: sortedBrands.length > 0 ? sortedBrands.slice(0, 3).join(" • ") : undefined,
        productCount: formatProductCountLabel(entry.count),
      });
    }
    return result;
  },
);
