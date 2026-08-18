"use client";

import type { CategoryFilters } from "@/types/filters";
import AvailabilityFilter from "./AvailabilityFilter";
import BrandFilter from "./BrandFilter";
import ConditionFilter from "./ConditionFilter";
import PriceRangeFilter from "./PriceRangeFilter";
import RatingFilter from "./RatingFilter";

interface FilterSidebarProps {
  filters: CategoryFilters;
  facets: {
    brands: Array<{ slug: string; name: string; count: number }>;
    priceRange: { min: number; max: number };
  };
  onUpdate: (patch: Partial<CategoryFilters>) => void;
  className?: string;
}

import { memo, useCallback } from "react";

export default memo(function FilterSidebar({
  filters,
  facets,
  onUpdate,
  className = "",
}: FilterSidebarProps) {
  const handleBrandsChange = useCallback(
    (brands: string[]) => onUpdate({ brands }),
    [onUpdate]
  );
  
  const handlePriceChange = useCallback(
    (minPrice: number | null, maxPrice: number | null) =>
      onUpdate({ 
        minPrice: minPrice ?? undefined, 
        maxPrice: maxPrice ?? undefined 
      }),
    [onUpdate]
  );
  
  const handleConditionsChange = useCallback(
    (conditions: CategoryFilters["conditions"]) => onUpdate({ conditions }),
    [onUpdate]
  );
  
  const handleRatingChange = useCallback(
    (rating: number | null) => onUpdate({ rating: rating ?? undefined }),
    [onUpdate]
  );
  
  const handleAvailabilityChange = useCallback(
    (availability: CategoryFilters["availability"]) => onUpdate({ availability }),
    [onUpdate]
  );

  return (
    <aside
      className={`cat-filter-sidebar ${className}`.trim()}
      aria-label="Product filters"
    >
      <BrandFilter
        brands={facets.brands}
        selected={filters.brands}
        onChange={handleBrandsChange}
      />
      <PriceRangeFilter
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        rangeMin={facets.priceRange.min}
        rangeMax={facets.priceRange.max}
        onChange={handlePriceChange}
      />
      <ConditionFilter
        selected={filters.conditions}
        onChange={handleConditionsChange}
      />
      <RatingFilter
        selected={filters.rating}
        onChange={handleRatingChange}
      />
      <AvailabilityFilter
        selected={filters.availability}
        onChange={handleAvailabilityChange}
      />
    </aside>
  );
});
