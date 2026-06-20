import { buildCategoryProductsResult } from "@/lib/catalog/categoryProductsCore";
import { fetchProducts } from "@/services/products.api";
import type { CategoryFilters, CategoryProductsResult } from "@/types/filters";

export async function fetchCategoryProducts(
  categorySlug: string,
  filters: CategoryFilters
): Promise<CategoryProductsResult> {
  const categoryProducts = await fetchProducts({ category: categorySlug });
  return buildCategoryProductsResult(categoryProducts, filters);
}
