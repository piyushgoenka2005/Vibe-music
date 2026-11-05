import { buildCategoryProductsResult } from "@/lib/catalog/categoryProductsCore";
import { fetchProducts } from "@/services/client/products.api";
import type { CategoryFilters, CategoryProductsResult } from "@/types/filters";

export async function fetchCategoryProducts(
  categorySlug: string,
  filters: CategoryFilters,
): Promise<CategoryProductsResult> {
  const categoryProducts = await fetchProducts({
    category: categorySlug,
    subcategory: filters.subcategories.length > 0 ? filters.subcategories : undefined,
  });
  return buildCategoryProductsResult(categoryProducts, filters);
}
