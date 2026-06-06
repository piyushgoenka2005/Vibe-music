"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCategoryProducts } from "@/services/category.service";
import type { CategoryFilters } from "@/types/filters";

export function useCategoryProducts(
  categorySlug: string,
  filters: CategoryFilters
) {
  return useQuery({
    queryKey: ["category-products", categorySlug, filters],
    queryFn: () => fetchCategoryProducts(categorySlug, filters),
    enabled: Boolean(categorySlug),
  });
}
