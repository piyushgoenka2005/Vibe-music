"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  filtersToSearchParams,
  hasActiveFilters,
  parseFiltersFromSearchParams,
} from "@/lib/filterUrl";
import { DEFAULT_FILTERS, type CategoryFilters } from "@/types/filters";

export function useCategoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams]
  );

  const updateFilters = useCallback(
    (patch: Partial<CategoryFilters>, resetPage = true) => {
      const next: CategoryFilters = {
        ...filters,
        ...patch,
        page: resetPage ? 1 : (patch.page ?? filters.page),
      };
      const params = filtersToSearchParams(next);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router]
  );

  const clearAllFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

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
    defaults: DEFAULT_FILTERS,
  };
}
