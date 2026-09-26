"use client";

import FilterSidebar from "./FilterSidebar";
import type { CategoryFilters, SpecFacetGroup } from "@/types/filters";

interface ListingFilterRailProps {
  filters: CategoryFilters;
  facets: {
    brands: Array<{ slug: string; name: string; count: number }>;
    categories: Array<{ slug: string; name: string; count: number }>;
    subcategories: Array<{ slug: string; name: string; count: number }>;
    specs: SpecFacetGroup[];
    priceRange: { min: number; max: number };
  };
  onUpdate: (patch: Partial<CategoryFilters>, resetPage?: boolean) => void;
  showCategoryFacets?: boolean;
  resultCount?: number;
  hasActive?: boolean;
  activeCount?: number;
  onClearAll?: () => void;
}

export default function ListingFilterRail({
  filters,
  facets,
  onUpdate,
  showCategoryFacets = false,
  resultCount,
  hasActive = false,
  activeCount = 0,
  onClearAll,
}: ListingFilterRailProps) {
  return (
    <div className="cat-filter-rail">
      <div className="cat-filter-rail__summary">
        <h2 className="cat-filter-rail__title">Filters</h2>
        {typeof resultCount === "number" ? (
          <p className="cat-filter-rail__count">
            {resultCount} {resultCount === 1 ? "product" : "products"}
          </p>
        ) : null}
        {hasActive && activeCount > 0 && onClearAll ? (
          <button type="button" className="cat-filter-rail__clear" onClick={onClearAll}>
            Clear all ({activeCount})
          </button>
        ) : null}
      </div>
      <FilterSidebar
        filters={filters}
        facets={facets}
        onUpdate={onUpdate}
        className="cat-filter-sidebar--desktop"
        showCategoryFacets={showCategoryFacets}
      />
    </div>
  );
}
