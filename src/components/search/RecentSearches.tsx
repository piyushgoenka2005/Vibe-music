"use client";

import { searchStore } from "@/store/searchStore";
import type { SearchSuggestion } from "@/types/search";
import SearchHighlight from "./SearchHighlight";

interface RecentSearchesProps {
  items: SearchSuggestion[];
  query: string;
  activeIndexOffset: number;
  activeIndex: number;
  onSelect: (suggestion: SearchSuggestion) => void;
  onHover: (index: number) => void;
}

export default function RecentSearches({
  items,
  query,
  activeIndexOffset,
  activeIndex,
  onSelect,
  onHover,
}: RecentSearchesProps) {
  if (items.length === 0) return null;

  return (
    <div className="sw-search-group" role="group" aria-label="Recent searches">
      <div className="sw-search-group__header">
        <h4 className="sw-search-group__title">Recent searches</h4>
        <button
          type="button"
          className="sw-search-recent__clear"
          onClick={() => searchStore.clearRecentSearches()}
        >
          Clear all
        </button>
      </div>
      <ul aria-label="Recent search suggestions">
        {items.map((item, index) => {
          const flatIndex = activeIndexOffset + index;
          const isActive = activeIndex === flatIndex;
          return (
            <li key={item.id} role="presentation" className="sw-search-recent__row">
              <button
                type="button"
                id={`sw-search-option-${flatIndex}`}
                role="option"
                aria-selected={isActive}
                className={`sw-search-suggestion sw-search-suggestion--recent${
                  isActive ? " sw-search-suggestion--active" : ""
                }`}
                onMouseEnter={() => onHover(flatIndex)}
                onClick={() => onSelect(item)}
              >
                <span className="sw-search-suggestion__copy sw-search-suggestion__copy--full">
                  <span className="sw-search-suggestion__label">
                    <SearchHighlight text={item.label} query={query} />
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="sw-search-recent__remove"
                aria-label={`Remove ${item.label} from recent searches`}
                onClick={() => searchStore.removeRecentSearch(item.label)}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
