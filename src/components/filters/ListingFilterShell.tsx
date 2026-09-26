"use client";

import type { ReactNode } from "react";
import ListingFilterRail from "./ListingFilterRail";
import type { CategoryFilters, SpecFacetGroup } from "@/types/filters";

interface ListingFilterShellProps {
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
  children: ReactNode;
}

/** Desktop: sticky left filter rail + main column (hero, toolbar, products). */
export default function ListingFilterShell({
  filters,
  facets,
  onUpdate,
  showCategoryFacets = false,
  resultCount,
  hasActive = false,
  activeCount = 0,
  onClearAll,
  children,
}: ListingFilterShellProps) {
  return (
    <div className="cat-listing-shell">
      <div className="cat-listing-shell__rail">
        <ListingFilterRail
          filters={filters}
          facets={facets}
          onUpdate={onUpdate}
          showCategoryFacets={showCategoryFacets}
          resultCount={resultCount}
          hasActive={hasActive}
          activeCount={activeCount}
          onClearAll={onClearAll}
        />
      </div>
      <div className="cat-listing-shell__main">{children}</div>
    </div>
  );
}
