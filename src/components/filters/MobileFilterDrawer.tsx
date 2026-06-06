"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useFilterStore } from "@/store/filterStore";
import type { CategoryFilters } from "@/types/filters";
import FilterSidebar from "./FilterSidebar";

interface MobileFilterDrawerProps {
  filters: CategoryFilters;
  facets: {
    brands: Array<{ slug: string; name: string; count: number }>;
    priceRange: { min: number; max: number };
  };
  onUpdate: (patch: Partial<CategoryFilters>) => void;
  resultCount: number;
}

export default function MobileFilterDrawer({
  filters,
  facets,
  onUpdate,
  resultCount,
}: MobileFilterDrawerProps) {
  const open = useFilterStore((s) => s.mobileDrawerOpen);
  const close = useFilterStore((s) => s.closeMobileDrawer);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (open) document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open, close]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="cat-mobile-drawer-overlay"
        onClick={close}
        aria-hidden="true"
      />
      <div
        className="cat-mobile-drawer cat-mobile-drawer--open"
        role="dialog"
        aria-modal="true"
        aria-label="Filter products"
      >
        <div className="cat-mobile-drawer__header">
          <h2 style={{ margin: 0, fontSize: 18 }}>Filters</h2>
          <button
            type="button"
            className="cat-mobile-drawer__close"
            onClick={close}
          >
            Done ({resultCount})
          </button>
        </div>
        <FilterSidebar
          filters={filters}
          facets={facets}
          onUpdate={(patch) => {
            onUpdate(patch);
          }}
        />
      </div>
    </>,
    document.body
  );
}
