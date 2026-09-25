"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  countActiveFilters,
  filtersToSearchParams,
  hasActiveFilters,
  parseFiltersFromSearchParams,
} from "@/lib/filterUrl";
import { DEFAULT_FILTERS, type CategoryFilters } from "@/types/filters";

/** Listing filters on `/brands`, preserving the A–Z `letter` param. */
export function useBrandsBrowseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const letter = searchParams.get("letter")?.trim() ?? "";
  const brandParam = searchParams.get("brand")?.split(",")[0]?.trim() ?? "";

  const filters = useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams]);

  const applyPreserved = useCallback(
    (params: URLSearchParams) => {
      if (letter) params.set("letter", letter);
      else params.delete("letter");
      if (brandParam) params.set("brand", brandParam);
      else params.delete("brand");
      return params;
    },
    [brandParam, letter],
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
    [applyPreserved, filters, pathname, router],
  );

  const setLetter = useCallback(
    (nextLetter: string | null) => {
      const params = applyPreserved(filtersToSearchParams(filters));
      if (nextLetter) params.set("letter", nextLetter);
      else params.delete("letter");
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [applyPreserved, filters, pathname, router],
  );

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (letter) params.set("letter", letter);
    if (brandParam) params.set("brand", brandParam);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [brandParam, letter, pathname, router]);

  const clearBrowse = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  const removeBrand = useCallback(
    (brandSlug: string) => {
      updateFilters({
        brands: filters.brands.filter((brand) => brand !== brandSlug),
      });
    },
    [filters.brands, updateFilters],
  );

  const removeCategory = useCallback(
    (categorySlug: string) => {
      updateFilters({
        categories: filters.categories.filter((category) => category !== categorySlug),
      });
    },
    [filters.categories, updateFilters],
  );

  const removeSubcategory = useCallback(
    (subcategorySlug: string) => {
      updateFilters({
        subcategories: filters.subcategories.filter((entry) => entry !== subcategorySlug),
      });
    },
    [filters.subcategories, updateFilters],
  );

  const removeSpec = useCallback(
    (label: string, valueSlug: string) => {
      const current = filters.specs[label] ?? [];
      const nextValues = current.filter((value) => value !== valueSlug);
      const specs = { ...filters.specs };
      if (nextValues.length) specs[label] = nextValues;
      else delete specs[label];
      updateFilters({ specs });
    },
    [filters.specs, updateFilters],
  );

  const removeCondition = useCallback(
    (condition: CategoryFilters["conditions"][number]) => {
      updateFilters({
        conditions: filters.conditions.filter((entry) => entry !== condition),
      });
    },
    [filters.conditions, updateFilters],
  );

  return {
    letter,
    filters,
    updateFilters,
    setLetter,
    clearAllFilters,
    clearBrowse,
    removeBrand,
    removeCategory,
    removeSubcategory,
    removeSpec,
    removeCondition,
    hasActive: hasActiveFilters(filters),
    activeCount: countActiveFilters(filters),
    defaults: DEFAULT_FILTERS,
  };
}
