"use client";

import { useEffect, useMemo } from "react";
import { useSearchResults } from "@/hooks/useSearch";
import { searchStore, useSearchStore } from "@/store/searchStore";
import SearchEmptyState from "./SearchEmptyState";
import SearchFilters from "./SearchFilters";
import SearchResults from "./SearchResults";
import "./search.css";

interface SearchResultsPageProps {
  query: string;
  initialCategory?: string;
  initialBrand?: string;
}

export default function SearchResultsPage({
  query,
  initialCategory = "",
  initialBrand = "",
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
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
    }),
    [
      filters.brand,
      filters.category,
      filters.maxPrice,
      filters.minPrice,
      filters.sort,
      initialBrand,
      initialCategory,
    ]
  );

  const { status, error, results } = useSearchResults(query, effectiveFilters);

  const productCount = results?.products.length ?? 0;

  return (
    <div className="sw-search-results-page">
      <header className="sw-search-results__header">
        <h1 className="sw-search-results__title">Search Results</h1>
        <p className="sw-search-results__meta">
          {query ? (
            <>
              Showing results for <strong>&ldquo;{query}&rdquo;</strong>
              {status === "loading" ? " — loading..." : ` — ${productCount} products`}
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
        <div className="sw-search-results__layout">
          <SearchFilters />
          <div>
            {productCount === 0 ? (
              <SearchEmptyState query={query} />
            ) : (
              <SearchResults products={results.products} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
