"use client";

import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import SearchHighlight from "@/components/search/SearchHighlight";
import type { SearchSuggestion } from "@/types/search";
import { formatDisplayPrice } from "@/utils/currency";

interface SearchSuggestionGroupProps {
  title: string;
  items: SearchSuggestion[];
  query: string;
  activeIndexOffset: number;
  activeIndex: number;
  onSelect: (suggestion: SearchSuggestion) => void;
  onHover: (index: number) => void;
  variant?: "default" | "product" | "chip";
}

export default function SearchSuggestionGroup({
  title,
  items,
  query,
  activeIndexOffset,
  activeIndex,
  onSelect,
  onHover,
  variant = "default",
}: SearchSuggestionGroupProps) {
  if (items.length === 0) return null;

  if (variant === "chip") {
    return (
      <div className="sw-search-group" role="group" aria-label={title}>
        <h4 className="sw-search-group__title">{title}</h4>
        <ul className="sw-search-chip-list" aria-label={`${title} suggestions`}>
          {items.map((item, index) => {
            const flatIndex = activeIndexOffset + index;
            const isActive = activeIndex === flatIndex;
            return (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  id={`sw-search-option-${flatIndex}`}
                  role="option"
                  aria-selected={isActive}
                  className={`sw-search-chip${isActive ? " sw-search-chip--active" : ""}`}
                  onMouseEnter={() => onHover(flatIndex)}
                  onClick={() => onSelect(item)}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="sw-search-group" role="group" aria-label={title}>
      <h4 className="sw-search-group__title">{title}</h4>
      <ul aria-label={`${title} suggestions`}>
        {items.map((item, index) => {
          const flatIndex = activeIndexOffset + index;
          const isActive = activeIndex === flatIndex;
          const isProduct =
            variant === "product" ||
            item.type === "product" ||
            item.type === "viewed";

          return (
            <li key={item.id} role="presentation">
              <button
                type="button"
                id={`sw-search-option-${flatIndex}`}
                role="option"
                aria-selected={isActive}
                className={`sw-search-suggestion${
                  isProduct ? " sw-search-suggestion--product" : ""
                }${isActive ? " sw-search-suggestion--active" : ""}`}
                onMouseEnter={() => onHover(flatIndex)}
                onClick={() => onSelect(item)}
              >
                {isProduct ? (
                  <>
                    <span className="sw-search-suggestion__thumb" aria-hidden="true">
                      {item.image ? (
                        <StorefrontThumbImage
                          src={item.image}
                          alt=""
                          width={48}
                          height={48}
                          className="sw-search-suggestion__thumb-img"
                        />
                      ) : (
                        <span className="sw-search-suggestion__thumb-fallback" />
                      )}
                    </span>
                    <span className="sw-search-suggestion__copy">
                      <span className="sw-search-suggestion__label">
                        <SearchHighlight text={item.label} query={query} />
                      </span>
                      {item.sublabel ? (
                        <span className="sw-search-suggestion__sublabel">{item.sublabel}</span>
                      ) : null}
                    </span>
                    {typeof item.price === "number" ? (
                      <span className="sw-search-suggestion__price">
                        {formatDisplayPrice(item.price)}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="sw-search-suggestion__copy sw-search-suggestion__copy--full">
                    <span className="sw-search-suggestion__label">
                      <SearchHighlight text={item.label} query={query} />
                    </span>
                    {item.sublabel ? (
                      <span className="sw-search-suggestion__sublabel">{item.sublabel}</span>
                    ) : null}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
