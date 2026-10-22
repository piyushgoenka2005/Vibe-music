import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { buildCategoryProductsResult } from "@/lib/catalog/categoryProductsCore";
import { searchProducts } from "@/services/catalogService";
import {
  DEFAULT_FILTERS,
  type CategoryFilters,
  type CategoryProductsResult,
} from "@/types/filters";

async function loadDefaultCategoryProducts(categorySlug: string): Promise<CategoryProductsResult> {
  const categoryProducts = await searchProducts({
    category: categorySlug,
    purchasableOnly: false,
  });
  return buildCategoryProductsResult(categoryProducts, DEFAULT_FILTERS);
}

const getCachedCategoryProducts = unstable_cache(
  loadDefaultCategoryProducts,
  ["category-products-default-v2"],
  { revalidate: 300, tags: ["catalog"] },
);

function isDefaultFilters(filters?: CategoryFilters): boolean {
  if (!filters || filters === DEFAULT_FILTERS) return true;
  return (
    (!filters.brands || filters.brands.length === 0) &&
    (!filters.subcategories || filters.subcategories.length === 0) &&
    (!filters.conditions || filters.conditions.length === 0) &&
    filters.minPrice == null &&
    filters.maxPrice == null &&
    filters.rating == null &&
    (filters.availability === "all" || !filters.availability) &&
    (filters.sort === "relevance" || !filters.sort) &&
    (filters.page === 1 || !filters.page)
  );
}

export const loadCategoryProducts = cache(async function loadCategoryProducts(
  categorySlug: string,
  filters: CategoryFilters = DEFAULT_FILTERS,
): Promise<CategoryProductsResult> {
  if (isDefaultFilters(filters)) {
    return getCachedCategoryProducts(categorySlug);
  }

  // Include Coming Soon (₹0) SKUs so categories aren't empty when prices
  // aren't set yet — ProductCard already shows Notify Me for those.
  const categoryProducts = await searchProducts({
    category: categorySlug,
    purchasableOnly: false,
  });
  return buildCategoryProductsResult(categoryProducts, filters);
});
