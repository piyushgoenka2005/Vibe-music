"use client";

import type { SearchSuggestion } from "@/types/search";

interface SearchSuggestionsProps {
  title: string;
  items: SearchSuggestion[];
  activeIndexOffset: number;
  activeIndex: number;
  onSelect: (suggestion: SearchSuggestion) => void;
  onHover: (index: number) => void;
}

export default function SearchSuggestions({
  title,
  items,
  activeIndexOffset,
  activeIndex,
  onSelect,
  onHover,
}: SearchSuggestionsProps) {
  if (items.length === 0) return null;

  return (
    <div className="sw-search-group" role="group" aria-label={title}>
      <h4 className="sw-search-group__title">{title}</h4>
      <ul role="listbox" aria-label={`${title} suggestions`}>
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
                <span>
                  <span className="sw-search-suggestion__label">{item.label}</span>
                  {item.sublabel ? (
                    <span className="sw-search-suggestion__sublabel">
                      {" "}
                      — {item.sublabel}
                    </span>
                  ) : null}
                </span>
                <span className="sw-search-suggestion__type">{item.type}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
