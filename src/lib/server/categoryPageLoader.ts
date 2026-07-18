import "server-only";

import { cache } from "react";
import { buildCategoryProductsResult } from "@/lib/catalog/categoryProductsCore";
import { searchProducts } from "@/services/catalogService";
import { DEFAULT_FILTERS, type CategoryFilters, type CategoryProductsResult } from "@/types/filters";

export const loadCategoryProducts = cache(async function loadCategoryProducts(
  categorySlug: string,
  filters: CategoryFilters = DEFAULT_FILTERS
): Promise<CategoryProductsResult> {
  // Include Coming Soon (₹0) SKUs so categories aren't empty when prices
  // aren't set yet — ProductCard already shows Notify Me for those.
  const categoryProducts = await searchProducts({
    category: categorySlug,
    purchasableOnly: false,
  });
  return buildCategoryProductsResult(categoryProducts, filters);
});
