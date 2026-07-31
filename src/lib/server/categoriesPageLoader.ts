import "server-only";

import { cache } from "react";
import {
  getCategoryGridImage,
  hasCuratedCategoryImage,
} from "@/lib/categoryImages";
import { getCategoryCatalog } from "@/lib/server/categoryResolver";
import { getAllProducts } from "@/services/catalogService";
import type { Category } from "@/types/category";

export interface CategoryIndexItem extends Category {
  productCount: number;
  imageSrc?: string;
}

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
        // Always prefer curated local art over CMS imageUrl — admin/CMS often
        // reused the Guitars Les Paul thumb for Bass, Software, etc.
        const imageSrc = hasCuratedCategoryImage(category.slug)
          ? getCategoryGridImage(category.slug)
          : category.imageUrl || getCategoryGridImage(category.slug);
        return {
          ...category,
          productCount,
          imageSrc,
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
