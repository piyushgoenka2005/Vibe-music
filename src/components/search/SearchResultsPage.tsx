"use client";

import { useEffect, useMemo } from "react";
import { useSearchResults } from "@/hooks/useSearch";
import { searchStore, useSearchStore } from "@/store/searchStore";
import SearchEmptyState from "./SearchEmptyState";
import SearchFilters from "./SearchFilters";
import SearchMobileFilterDrawer from "./SearchMobileFilterDrawer";
import SearchResults from "./SearchResults";
import type { SearchResultsData } from "@/types/search";
import "./search.css";

interface SearchResultsPageProps {
  query: string;
  initialCategory?: string;
  initialBrand?: string;
  /** Server-rendered results for the initial query — skips the first client fetch. */
  initialResults?: SearchResultsData | null;
}

export default function SearchResultsPage({
  query,
  initialCategory = "",
  initialBrand = "",
  initialResults = null,
}: SearchResultsPageProps) {
  const filters = useSearchStore((s) => s.filters);

  useEffect(() => {
    if (initialCategory || initialBrand) {
      searchStore.setFilters({
        category: initialCategory,
        brand: initialBrand,
      });
    }
  }, [initialBrand, initialCategory]);

  const effectiveFilters = useMemo(
    () => ({
      category: filters.category || initialCategory,
      brand: filters.brand || initialBrand,
      sort: filters.sort,
    }),
    [filters.brand, filters.category, filters.sort, initialBrand, initialCategory]
  );

  const { status, error, results } = useSearchResults(query, effectiveFilters, {
    initialResults,
    initialFilters: { category: initialCategory, brand: initialBrand },
  });

  const productCount = results?.products.length ?? 0;

  return (
    <div className="sw-search-results-page">
      <header className="sw-search-results__header storefront-page__header">
        <p className="storefront-page__eyebrow">Search</p>
        <h1 className="sw-search-results__title">Search Results</h1>
        <p className="sw-search-results__meta">
          {query || effectiveFilters.category || effectiveFilters.brand ? (
            <>
              {query ? (
                <>
                  Showing results for <strong>&ldquo;{query}&rdquo;</strong>
                </>
              ) : (
                <>Showing filtered results</>
              )}
              {status === "loading"
                ? " — loading..."
                : ` — ${productCount} products`}
            </>
          ) : (
            "Enter a search term to see results."
          )}
        </p>
      </header>

      {status === "error" && error ? (
        <div className="sw-search-status" role="alert">
          {error}
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="sw-search-status" role="status" aria-live="polite">
          <div className="sw-search-spinner" aria-hidden="true" />
          Loading search results...
        </div>
      ) : null}

      {status !== "loading" && results ? (
        <>
          <div className="sw-search-mobile-toolbar">
            <span className="sw-search-results__meta">
              {productCount} product{productCount === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              className="sw-search-mobile-filter-btn"
              onClick={() => searchStore.openMobileFilters()}
            >
              Filter &amp; Sort
            </button>
          </div>
          <div className="sw-search-results__layout">
            <SearchFilters
              className="sw-search-filters--sidebar"
              categories={results.categories}
              brands={results.brands}
            />
            <div>
              {productCount === 0 ? (
                <SearchEmptyState query={query} />
              ) : (
                <SearchResults query={query} products={results.products} />
              )}
            </div>
          </div>
          <SearchMobileFilterDrawer
            brands={results.brands}
            categories={results.categories}
            resultCount={productCount}
          />
        </>
      ) : null}
    </div>
  );
}
