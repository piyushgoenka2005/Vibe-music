"use client";

import { useEffect } from "react";
import { MIN_QUERY_LENGTH } from "@/services/search.service";
import type { SearchStatus, SearchSuggestion, SearchSuggestionGroups } from "@/types/search";
import RecentSearches from "./RecentSearches";
import SearchSuggestionGroup from "./SearchSuggestionGroup";

interface SearchAutocompleteProps {
  query: string;
  status: SearchStatus;
  error: string | null;
  groups: SearchSuggestionGroups;
  activeIndex: number;
  onSelect: (suggestion: SearchSuggestion) => void;
  onHover: (index: number) => void;
  onSubmit?: () => void;
}

function groupOffsets(groups: SearchSuggestionGroups) {
  let offset = 0;
  const keywords = offset;
  offset += groups.keywords.length;
  const categories = offset;
  offset += groups.categories.length;
  const brands = offset;
  offset += groups.brands.length;
  const products = offset;
  offset += groups.products.length;
  const recentlyViewed = offset;
  offset += groups.recentlyViewed.length;
  const recent = offset;
  return { keywords, categories, brands, products, recentlyViewed, recent };
}

function hasSuggestions(groups: SearchSuggestionGroups): boolean {
  return (
    groups.keywords.length +
      groups.categories.length +
      groups.brands.length +
      groups.products.length +
      groups.recentlyViewed.length +
      groups.recent.length >
    0
  );
}

function isDiscoveryState(groups: SearchSuggestionGroups, query: string): boolean {
  return (
    query.trim().length === 0 &&
    groups.recent.length === 0 &&
    groups.recentlyViewed.length === 0 &&
    groups.products.length === 0
  );
}

export default function SearchAutocomplete({
  query,
  status,
  error,
  groups,
  activeIndex,
  onSelect,
  onHover,
  onSubmit,
}: SearchAutocompleteProps) {
  const offsets = groupOffsets(groups);
  const suggestionsAvailable = hasSuggestions(groups);
  const showDiscoveryLead = isDiscoveryState(groups, query);
  const isFallbackDiscovery = groups.keywords.some((item) =>
    item.id.startsWith("empty-")
  );
  const useChipVariant = showDiscoveryLead || isFallbackDiscovery;
  const showViewAll = query.length >= MIN_QUERY_LENGTH && Boolean(onSubmit);
  const isLoadingMore = status === "loading" && query.length >= MIN_QUERY_LENGTH;
  const viewAll = showViewAll ? (
    <button type="button" className="sw-search-view-all" onClick={onSubmit}>
      View all results for &ldquo;{query}&rdquo;
    </button>
  ) : null;

  useEffect(() => {
    if (activeIndex < 0) return;
    document
      .getElementById(`sw-search-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (status === "error" && error) {
    return (
      <div className="sw-search-status" role="alert">
        <p>{error}</p>
        {viewAll}
      </div>
    );
  }

  if (!suggestionsAvailable && !isLoadingMore) {
    return null;
  }

  return (
    <>
      <div
        id="sw-search-panel-listbox"
        className="sw-search-panel__body"
        role="region"
        aria-label="Search suggestions"
        aria-busy={isLoadingMore}
      >
        {showDiscoveryLead ? (
          <p className="sw-search-discovery__lead">
            Discover gear by category, brand, or trend.
          </p>
        ) : isFallbackDiscovery ? (
          <p className="sw-search-discovery__lead">
            No matches for &ldquo;{query}&rdquo;. Try these instead.
          </p>
        ) : null}
        {isLoadingMore ? (
          <div className="sw-search-status sw-search-status--inline" role="status" aria-live="polite">
            <div className="sw-search-spinner" aria-hidden="true" />
            Finding more matches...
          </div>
        ) : null}
        <SearchSuggestionGroup
          title={useChipVariant ? "Trending searches" : "Search suggestions"}
          items={groups.keywords}
          query={query}
          activeIndexOffset={offsets.keywords}
          activeIndex={activeIndex}
          onSelect={onSelect}
          onHover={onHover}
          variant={useChipVariant ? "chip" : "default"}
        />
        <SearchSuggestionGroup
          title={useChipVariant ? "Popular categories" : "Categories"}
          items={groups.categories}
          query={query}
          activeIndexOffset={offsets.categories}
          activeIndex={activeIndex}
          onSelect={onSelect}
          onHover={onHover}
          variant={useChipVariant ? "chip" : "default"}
        />
        <SearchSuggestionGroup
          title={useChipVariant ? "Popular brands" : "Brands"}
          items={groups.brands}
          query={query}
          activeIndexOffset={offsets.brands}
          activeIndex={activeIndex}
          onSelect={onSelect}
          onHover={onHover}
          variant={useChipVariant ? "chip" : "default"}
        />
        <SearchSuggestionGroup
          title="Products"
          items={groups.products}
          query={query}
          activeIndexOffset={offsets.products}
          activeIndex={activeIndex}
          onSelect={onSelect}
          onHover={onHover}
          variant="product"
        />
        <SearchSuggestionGroup
          title="Recently viewed"
          items={groups.recentlyViewed}
          query={query}
          activeIndexOffset={offsets.recentlyViewed}
          activeIndex={activeIndex}
          onSelect={onSelect}
          onHover={onHover}
          variant="product"
        />
        <RecentSearches
          items={groups.recent}
          query={query}
          activeIndexOffset={offsets.recent}
          activeIndex={activeIndex}
          onSelect={onSelect}
          onHover={onHover}
        />
      </div>
      {viewAll}
    </>
  );
}
