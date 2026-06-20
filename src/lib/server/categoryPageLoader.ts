import "server-only";

import { cache } from "react";
import { buildCategoryProductsResult } from "@/lib/catalog/categoryProductsCore";
import { searchProducts } from "@/services/catalogService";
import { DEFAULT_FILTERS, type CategoryFilters, type CategoryProductsResult } from "@/types/filters";

export const loadCategoryProducts = cache(async function loadCategoryProducts(
  categorySlug: string,
  filters: CategoryFilters = DEFAULT_FILTERS
): Promise<CategoryProductsResult> {
  const categoryProducts = await searchProducts({ category: categorySlug });
  return buildCategoryProductsResult(categoryProducts, filters);
});
