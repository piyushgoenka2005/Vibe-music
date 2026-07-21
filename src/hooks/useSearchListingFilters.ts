"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  filtersToSearchParams,
  hasActiveFilters,
  countActiveFilters,
  parseFiltersFromSearchParams,
} from "@/lib/filterUrl";
import { DEFAULT_FILTERS, type CategoryFilters } from "@/types/filters";

/** Category-style filters on `/search/results`, while preserving `q` and `category`. */
export function useSearchListingFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams]
  );

  const preserved = useMemo(
    () => ({
      q: searchParams.get("q"),
      category: searchParams.get("category"),
      subcategory: searchParams.get("subcategory"),
    }),
    [searchParams]
  );

  const applyPreserved = useCallback(
    (params: URLSearchParams) => {
      if (preserved.q) params.set("q", preserved.q);
      else params.delete("q");
      if (preserved.category) params.set("category", preserved.category);
      else params.delete("category");
      if (preserved.subcategory) params.set("subcategory", preserved.subcategory);
      else params.delete("subcategory");
      return params;
    },
    [preserved.category, preserved.q, preserved.subcategory]
  );

  const updateFilters = useCallback(
    (patch: Partial<CategoryFilters>, resetPage = true) => {
      const next: CategoryFilters = {
        ...filters,
        ...patch,
        page: resetPage ? 1 : (patch.page ?? filters.page),
      };
      const params = applyPreserved(filtersToSearchParams(next));
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [applyPreserved, filters, pathname, router]
  );

  const clearAllFilters = useCallback(() => {
    const params = applyPreserved(new URLSearchParams());
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [applyPreserved, pathname, router]);

  const removeBrand = useCallback(
    (brandSlug: string) => {
      updateFilters({
        brands: filters.brands.filter((b) => b !== brandSlug),
      });
    },
    [filters.brands, updateFilters]
  );

  const removeCondition = useCallback(
    (condition: CategoryFilters["conditions"][number]) => {
      updateFilters({
        conditions: filters.conditions.filter((c) => c !== condition),
      });
    },
    [filters.conditions, updateFilters]
  );

  return {
    filters,
    updateFilters,
    clearAllFilters,
    removeBrand,
    removeCondition,
    hasActive: hasActiveFilters(filters),
    activeCount: countActiveFilters(filters),
    defaults: DEFAULT_FILTERS,
    categorySlug: preserved.category ?? "",
    subcategory: preserved.subcategory ?? "",
  };
}
