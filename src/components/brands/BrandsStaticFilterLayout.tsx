"use client";

import type { ReactNode } from "react";
import { useFilterStore } from "@/store/filterStore";
import type { CategoryFilters, SpecFacetGroup } from "@/types/filters";
import {
  FilterChips,
  FilterSidebar,
  MobileFilterDrawer,
  SortDropdown,
  ViewToggle,
} from "@/components/filters";
import { SlidersHorizontal } from "lucide-react";
import "@/components/filters/filters.css";

interface BrandsStaticFilterLayoutProps {
  filters: CategoryFilters;
  facets: {
    brands: Array<{ slug: string; name: string; count: number }>;
    categories: Array<{ slug: string; name: string; count: number }>;
    subcategories: Array<{ slug: string; name: string; count: number }>;
    specs: SpecFacetGroup[];
    priceRange: { min: number; max: number };
  };
  facetLabels: {
    brands: Record<string, string>;
    categories: Record<string, string>;
    subcategories: Record<string, string>;
    specs: SpecFacetGroup[];
  };
  resultCount: number;
  onUpdate: (patch: Partial<CategoryFilters>, resetPage?: boolean) => void;
  onClearAll: () => void;
  onRemoveBrand: (slug: string) => void;
  onRemoveCategory: (slug: string) => void;
  onRemoveSubcategory: (slug: string) => void;
  onRemoveSpec: (label: string, valueSlug: string) => void;
  onRemoveCondition: (condition: CategoryFilters["conditions"][number]) => void;
  hasActive: boolean;
  activeCount: number;
  children: ReactNode;
}

/** Persistent filter sidebar for every `/brands` view. */
export default function BrandsStaticFilterLayout({
  filters,
  facets,
  facetLabels,
  resultCount,
  onUpdate,
  onClearAll,
  onRemoveBrand,
  onRemoveCategory,
  onRemoveSubcategory,
  onRemoveSpec,
  onRemoveCondition,
  hasActive,
  activeCount,
  children,
}: BrandsStaticFilterLayoutProps) {
  const openMobileDrawer = useFilterStore((s) => s.openMobileDrawer);

  return (
    <>
      <div className="cat-toolbar brands-directory__filter-toolbar">
        <div className="cat-toolbar__primary">
          <button
            type="button"
            className={`cat-toolbar__mobile-btn${hasActive ? " cat-toolbar__mobile-btn--active" : ""}`}
            onClick={openMobileDrawer}
          >
            <SlidersHorizontal size={16} strokeWidth={2.25} aria-hidden />
            <span>Filters</span>
            {activeCount > 0 ? <span className="cat-toolbar__badge">{activeCount}</span> : null}
          </button>
          <span className="cat-toolbar__count" aria-live="polite">
            {resultCount} products
          </span>
        </div>
        <div className="cat-toolbar__controls">
          <SortDropdown value={filters.sort} onChange={(sort) => onUpdate({ sort })} />
          <ViewToggle value={filters.view} onChange={(view) => onUpdate({ view }, false)} />
        </div>
      </div>

      <FilterChips
        filters={filters}
        facetLabels={facetLabels}
        onRemoveBrand={onRemoveBrand}
        onRemoveCategory={onRemoveCategory}
        onRemoveSubcategory={onRemoveSubcategory}
        onRemoveSpec={onRemoveSpec}
        onRemoveCondition={onRemoveCondition}
        onUpdate={onUpdate}
        onClearAll={onClearAll}
      />

      <div className="cat-page__layout brands-directory__layout">
        <FilterSidebar
          filters={filters}
          facets={facets}
          onUpdate={onUpdate}
          className="cat-filter-sidebar--desktop brands-directory__filter-sidebar"
          showCategoryFacets
        />

        <div className="brands-directory__main">{children}</div>
      </div>

      <MobileFilterDrawer
        filters={filters}
        facets={facets}
        onUpdate={onUpdate}
        onClearAll={onClearAll}
        resultCount={resultCount}
        showCategoryFacets
      />
    </>
  );
}
