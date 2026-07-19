import "server-only";

import { cache } from "react";
import { POPULAR_CATEGORY_ITEMS } from "@/data/popularCategories";
import { getCategoryCatalog } from "@/lib/server/categoryResolver";
import { getAllProducts } from "@/services/catalogService";
import type { Category } from "@/types/category";

export interface CategoryIndexItem extends Category {
  productCount: number;
  imageSrc?: string;
}

const IMAGE_BY_SLUG = new Map(
  POPULAR_CATEGORY_ITEMS.map((item) => {
    const slug = item.href.split("/").filter(Boolean).pop() ?? "";
    return [slug, item.imageSrc] as const;
  })
);

export const loadCategoriesForIndex = cache(
  async function loadCategoriesForIndex(): Promise<CategoryIndexItem[]> {
    const [categories, products] = await Promise.all([
      getCategoryCatalog(),
      getAllProducts(false),
    ]);

    const countBySlug = new Map<string, number>();
    for (const product of products) {
      if (product.status !== "active") continue;
      const slug = product.categorySlug?.trim();
      if (!slug) continue;
      countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
    }

    return categories
      .map((category) => {
        const productCount =
          countBySlug.get(category.slug) ?? category.productCount ?? 0;
        return {
          ...category,
          productCount,
          imageSrc: category.imageUrl || IMAGE_BY_SLUG.get(category.slug),
        };
      })
      .filter((category) => category.productCount > 0)
      .sort((a, b) => {
        const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
  }
);
