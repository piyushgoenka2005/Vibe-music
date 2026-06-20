"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCategoryProducts } from "@/services/category.service";
import {
  DEFAULT_FILTERS,
  type CategoryFilters,
  type CategoryProductsResult,
} from "@/types/filters";

function isDefaultCategoryFilters(filters: CategoryFilters): boolean {
  return JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);
}

export function useCategoryProducts(
  categorySlug: string,
  filters: CategoryFilters,
  initialData?: CategoryProductsResult
) {
  const useInitialData = initialData && isDefaultCategoryFilters(filters);

  return useQuery({
    queryKey: ["category-products", categorySlug, filters],
    queryFn: () => fetchCategoryProducts(categorySlug, filters),
    enabled: Boolean(categorySlug),
    initialData: useInitialData ? initialData : undefined,
    staleTime: 60_000,
  });
}
