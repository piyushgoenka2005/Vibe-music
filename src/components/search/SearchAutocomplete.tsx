"use client";

import { MIN_QUERY_LENGTH } from "@/services/search.service";
import type { SearchStatus, SearchSuggestionGroups } from "@/types/search";
import RecentSearches from "./RecentSearches";
import SearchSuggestions from "./SearchSuggestions";

interface SearchAutocompleteProps {
  query: string;
  status: SearchStatus;
  error: string | null;
  groups: SearchSuggestionGroups;
  activeIndex: number;
  onSelect: (suggestion: import("@/types/search").SearchSuggestion) => void;
  onHover: (index: number) => void;
  onSubmit?: () => void;
}

function groupOffsets(groups: SearchSuggestionGroups) {
  const recent = 0;
  const products = groups.recent.length;
  const categories = products + groups.products.length;
  const brands = categories + groups.categories.length;
  return { recent, products, categories, brands };
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
  const hasSuggestions =
    groups.recent.length +
      groups.products.length +
      groups.categories.length +
      groups.brands.length >
    0;

  if (status === "error" && error) {
    return (
      <div className="sw-search-status" role="alert">
        <p>{error}</p>
        {query.length >= MIN_QUERY_LENGTH && onSubmit ? (
          <button type="button" className="sw-search-view-all" onClick={onSubmit}>
            View all results for &ldquo;{query}&rdquo;
          </button>
        ) : null}
      </div>
    );
  }

  if (query.length >= MIN_QUERY_LENGTH && onSubmit) {
    const viewAll = (
      <button type="button" className="sw-search-view-all" onClick={onSubmit}>
        View all results for &ldquo;{query}&rdquo;
      </button>
    );

    if (status === "loading") {
      return (
        <>
          <div className="sw-search-status" role="status" aria-live="polite">
            <div className="sw-search-spinner" aria-hidden="true" />
            Searching...
          </div>
          {viewAll}
        </>
      );
    }

    if (!hasSuggestions && status === "success") {
      return (
        <div className="sw-search-status" role="status">
          <p>No suggestions found.</p>
          {viewAll}
        </div>
      );
    }

    if (hasSuggestions) {
      return (
        <>
          <div
            className="sw-search-panel__body"
            role="listbox"
            aria-label="Search suggestions"
          >
            <RecentSearches
              items={groups.recent}
              activeIndexOffset={offsets.recent}
              activeIndex={activeIndex}
              onSelect={onSelect}
              onHover={onHover}
            />
            <SearchSuggestions
              title="Products"
              items={groups.products}
              activeIndexOffset={offsets.products}
              activeIndex={activeIndex}
              onSelect={onSelect}
              onHover={onHover}
            />
            <SearchSuggestions
              title="Categories"
              items={groups.categories}
              activeIndexOffset={offsets.categories}
              activeIndex={activeIndex}
              onSelect={onSelect}
              onHover={onHover}
            />
            <SearchSuggestions
              title="Brands"
              items={groups.brands}
              activeIndexOffset={offsets.brands}
              activeIndex={activeIndex}
              onSelect={onSelect}
              onHover={onHover}
            />
          </div>
          {viewAll}
        </>
      );
    }
  }

  if (status === "loading") {
    return (
      <div className="sw-search-status" role="status" aria-live="polite">
        <div className="sw-search-spinner" aria-hidden="true" />
        Searching...
      </div>
    );
  }

  if (query.length > 0 && query.length < MIN_QUERY_LENGTH) {
    return (
      <div className="sw-search-status" role="status">
        Type at least {MIN_QUERY_LENGTH} characters to search
      </div>
    );
  }

  if (!hasSuggestions && query.length === 0) {
    return null;
  }

  return (
    <div
      className="sw-search-panel__body"
      role="listbox"
      aria-label="Search suggestions"
    >
      <RecentSearches
        items={groups.recent}
        activeIndexOffset={offsets.recent}
        activeIndex={activeIndex}
        onSelect={onSelect}
        onHover={onHover}
      />
      <SearchSuggestions
        title="Products"
        items={groups.products}
        activeIndexOffset={offsets.products}
        activeIndex={activeIndex}
        onSelect={onSelect}
        onHover={onHover}
      />
      <SearchSuggestions
        title="Categories"
        items={groups.categories}
        activeIndexOffset={offsets.categories}
        activeIndex={activeIndex}
        onSelect={onSelect}
        onHover={onHover}
      />
      <SearchSuggestions
        title="Brands"
        items={groups.brands}
        activeIndexOffset={offsets.brands}
        activeIndex={activeIndex}
        onSelect={onSelect}
        onHover={onHover}
      />
    </div>
  );
}
