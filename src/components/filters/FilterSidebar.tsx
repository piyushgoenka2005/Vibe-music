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

export default function FilterSidebar({
  filters,
  facets,
  onUpdate,
  className = "",
}: FilterSidebarProps) {
  return (
    <aside
      className={`cat-filter-sidebar cat-filter-sidebar--desktop ${className}`.trim()}
      aria-label="Product filters"
    >
      <BrandFilter
        brands={facets.brands}
        selected={filters.brands}
        onChange={(brands) => onUpdate({ brands })}
      />
      <PriceRangeFilter
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        rangeMin={facets.priceRange.min}
        rangeMax={facets.priceRange.max}
        onChange={(minPrice, maxPrice) => onUpdate({ minPrice, maxPrice })}
      />
      <RatingFilter
        selected={filters.rating}
        onChange={(rating) => onUpdate({ rating })}
      />
      <AvailabilityFilter
        selected={filters.availability}
        onChange={(availability) => onUpdate({ availability })}
      />
      <ConditionFilter
        selected={filters.conditions}
        onChange={(conditions) => onUpdate({ conditions })}
      />
    </aside>
  );
}
