"use client";

import { useEffect, type RefObject } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { useDialogA11y } from "@/hooks/useCartDrawerA11y";
import { useFilterStore } from "@/store/filterStore";
import type { CategoryFilters } from "@/types/filters";
import { countActiveFilters } from "@/lib/filterUrl";
import FilterSidebar from "./FilterSidebar";

interface MobileFilterDrawerProps {
  filters: CategoryFilters;
  facets: {
    brands: Array<{ slug: string; name: string; count: number }>;
    priceRange: { min: number; max: number };
  };
  onUpdate: (patch: Partial<CategoryFilters>) => void;
  onClearAll?: () => void;
  resultCount: number;
}

export default function MobileFilterDrawer({
  filters,
  facets,
  onUpdate,
  onClearAll,
  resultCount,
}: MobileFilterDrawerProps) {
  const open = useFilterStore((s) => s.mobileDrawerOpen);
  const close = useFilterStore((s) => s.closeMobileDrawer);
  const activeCount = countActiveFilters(filters);
  const drawerRef = useDialogA11y(open, close);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="cat-mobile-drawer-overlay"
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={drawerRef as RefObject<HTMLDivElement>}
        className="cat-mobile-drawer cat-mobile-drawer--open"
        role="dialog"
        aria-modal="true"
        aria-label="Filter products"
      >
        <div className="cat-mobile-drawer__grab" aria-hidden="true" />
        <div className="cat-mobile-drawer__header">
          <div className="cat-mobile-drawer__title-row">
            <span className="cat-mobile-drawer__icon" aria-hidden="true">
              <SlidersHorizontal size={18} strokeWidth={2.25} />
            </span>
            <div>
              <h2 className="cat-mobile-drawer__title">Filters</h2>
              <p className="cat-mobile-drawer__subtitle">
                {activeCount > 0
                  ? `${activeCount} active · refine results`
                  : "Refine by brand, price & more"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cat-mobile-drawer__icon-close"
            onClick={close}
            aria-label="Close filters"
          >
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>

        <div className="cat-mobile-drawer__body">
          <FilterSidebar
            className="cat-filter-sidebar--drawer"
            filters={filters}
            facets={facets}
            onUpdate={onUpdate}
          />
        </div>

        <div className="cat-mobile-drawer__footer">
          {onClearAll && activeCount > 0 ? (
            <button
              type="button"
              className="cat-mobile-drawer__clear"
              onClick={onClearAll}
            >
              Clear all
            </button>
          ) : (
            <span className="cat-mobile-drawer__footer-spacer" />
          )}
          <button
            type="button"
            className="cat-mobile-drawer__apply"
            onClick={close}
          >
            Show {resultCount} result{resultCount === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
