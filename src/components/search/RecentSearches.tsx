"use client";

import { searchStore } from "@/store/searchStore";
import type { SearchSuggestion } from "@/types/search";

interface RecentSearchesProps {
  items: SearchSuggestion[];
  activeIndexOffset: number;
  activeIndex: number;
  onSelect: (suggestion: SearchSuggestion) => void;
  onHover: (index: number) => void;
}

export default function RecentSearches({
  items,
  activeIndexOffset,
  activeIndex,
  onSelect,
  onHover,
}: RecentSearchesProps) {
  if (items.length === 0) return null;

  return (
    <div className="sw-search-group" role="group" aria-label="Recent searches">
      <h4 className="sw-search-group__title">Recent Searches</h4>
      <button
        type="button"
        className="sw-search-recent__clear"
        onClick={() => searchStore.clearRecentSearches()}
      >
        Clear recent searches
      </button>
      <ul role="listbox" aria-label="Recent search suggestions">
        {items.map((item, index) => {
          const flatIndex = activeIndexOffset + index;
          const isActive = activeIndex === flatIndex;
          return (
            <li key={item.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                className={`sw-search-suggestion${isActive ? " sw-search-suggestion--active" : ""}`}
                onMouseEnter={() => onHover(flatIndex)}
                onClick={() => onSelect(item)}
              >
                <span className="sw-search-suggestion__label">{item.label}</span>
                <span className="sw-search-suggestion__type">Recent</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
