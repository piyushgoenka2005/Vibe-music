"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { searchStore, useSearchStore } from "@/store/searchStore";
import SearchFilters from "@/components/search/SearchFilters";
import type { SearchBrand, SearchCategory } from "@/types/search";

interface SearchMobileFilterDrawerProps {
  categories?: SearchCategory[];
  brands?: SearchBrand[];
  resultCount: number;
}

export default function SearchMobileFilterDrawer({
  categories = [],
  brands = [],
  resultCount,
}: SearchMobileFilterDrawerProps) {
  const open = useSearchStore((s) => s.mobileFilterOpen);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") searchStore.closeMobileFilters();
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="cat-mobile-drawer-overlay"
        onClick={() => searchStore.closeMobileFilters()}
        aria-hidden="true"
      />
      <div
        className="cat-mobile-drawer cat-mobile-drawer--open sw-search-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Filter search results"
      >
        <div className="cat-mobile-drawer__header">
          <h2 style={{ margin: 0, fontSize: 18 }}>Filter &amp; Sort</h2>
          <button
            type="button"
            className="cat-mobile-drawer__close"
            onClick={() => searchStore.closeMobileFilters()}
          >
            Done ({resultCount})
          </button>
        </div>
        <SearchFilters categories={categories} brands={brands} />
      </div>
    </>,
    document.body
  );
}
