"use client";

import type { CategoryFilters, SpecFacetGroup } from "@/types/filters";
import AvailabilityFilter from "./AvailabilityFilter";
import BrandFilter from "./BrandFilter";
import CategoryFacetFilter from "./CategoryFacetFilter";
import ConditionFilter from "./ConditionFilter";
import PriceRangeFilter from "./PriceRangeFilter";
import RatingFilter from "./RatingFilter";
import SpecificationFilter from "./SpecificationFilter";
import SubcategoryFilter from "./SubcategoryFilter";

interface FilterSidebarProps {
  filters: CategoryFilters;
  facets: {
    brands: Array<{ slug: string; name: string; count: number }>;
    categories: Array<{ slug: string; name: string; count: number }>;
    subcategories: Array<{ slug: string; name: string; count: number }>;
    specs: SpecFacetGroup[];
    priceRange: { min: number; max: number };
  };
  onUpdate: (patch: Partial<CategoryFilters>) => void;
  className?: string;
  /** Search / multi-category listings show category facets; category PLP uses subcategory facets. */
  showCategoryFacets?: boolean;
}

import { memo, useCallback } from "react";

export default memo(function FilterSidebar({
  filters,
  facets,
  onUpdate,
  className = "",
  showCategoryFacets = false,
}: FilterSidebarProps) {
  const handleBrandsChange = useCallback((brands: string[]) => onUpdate({ brands }), [onUpdate]);

  const handleCategoriesChange = useCallback(
    (categories: string[]) => onUpdate({ categories }),
    [onUpdate],
  );

  const handleSubcategoriesChange = useCallback(
    (subcategories: string[]) => onUpdate({ subcategories }),
    [onUpdate],
  );

  const handleSpecsChange = useCallback(
    (specs: Record<string, string[]>) => onUpdate({ specs }),
    [onUpdate],
  );

  const handlePriceChange = useCallback(
    (minPrice: number | null, maxPrice: number | null) =>
      onUpdate({
        minPrice: minPrice ?? undefined,
        maxPrice: maxPrice ?? undefined,
      }),
    [onUpdate],
  );

  const handleConditionsChange = useCallback(
    (conditions: CategoryFilters["conditions"]) => onUpdate({ conditions }),
    [onUpdate],
  );

  const handleRatingChange = useCallback(
    (rating: number | null) => onUpdate({ rating: rating ?? undefined }),
    [onUpdate],
  );

  const handleAvailabilityChange = useCallback(
    (availability: CategoryFilters["availability"]) => onUpdate({ availability }),
    [onUpdate],
  );

  return (
    <aside className={`cat-filter-sidebar ${className}`.trim()} aria-label="Product filters">
      <BrandFilter brands={facets.brands} selected={filters.brands} onChange={handleBrandsChange} />
      {showCategoryFacets ? (
        <CategoryFacetFilter
          categories={facets.categories}
          selected={filters.categories}
          onChange={handleCategoriesChange}
        />
      ) : (
        <SubcategoryFilter
          subcategories={facets.subcategories}
          selected={filters.subcategories}
          onChange={handleSubcategoriesChange}
        />
      )}
      <SpecificationFilter
        groups={facets.specs}
        selected={filters.specs}
        onChange={handleSpecsChange}
      />
      <PriceRangeFilter
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        rangeMin={facets.priceRange.min}
        rangeMax={facets.priceRange.max}
        onChange={handlePriceChange}
      />
      <ConditionFilter selected={filters.conditions} onChange={handleConditionsChange} />
      <RatingFilter selected={filters.rating} onChange={handleRatingChange} />
      <AvailabilityFilter selected={filters.availability} onChange={handleAvailabilityChange} />
    </aside>
  );
});
