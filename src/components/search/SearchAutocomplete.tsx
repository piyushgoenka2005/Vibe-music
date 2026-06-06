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
}: SearchAutocompleteProps) {
  const offsets = groupOffsets(groups);
  const hasSuggestions =
    groups.recent.length +
      groups.products.length +
      groups.categories.length +
      groups.brands.length >
    0;

  if (status === "loading") {
    return (
      <div className="sw-search-status" role="status" aria-live="polite">
        <div className="sw-search-spinner" aria-hidden="true" />
        Searching...
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className="sw-search-status" role="alert">
        {error}
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

  if (!hasSuggestions && query.length >= MIN_QUERY_LENGTH && status === "success") {
    return (
      <div className="sw-search-status" role="status">
        No suggestions found. Press Enter to view all results.
      </div>
    );
  }

  if (!hasSuggestions && query.length === 0) {
    return (
      <div className="sw-search-status" role="status">
        Search for products, categories, and brands
      </div>
    );
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
