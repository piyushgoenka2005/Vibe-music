"use client";

import { memo, useMemo, useState } from "react";

export interface FacetOption {
  slug: string;
  name: string;
  count: number;
}

interface FacetCheckboxListProps {
  options: FacetOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  initialVisible?: number;
  emptyLabel?: string;
}

function toggleValue(selected: string[], slug: string): string[] {
  if (selected.includes(slug)) {
    return selected.filter((value) => value !== slug);
  }
  return [...selected, slug];
}

export default memo(function FacetCheckboxList({
  options,
  selected,
  onChange,
  initialVisible = 8,
  emptyLabel,
}: FacetCheckboxListProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleOptions = useMemo(() => {
    if (expanded || options.length <= initialVisible) return options;
    return options.slice(0, initialVisible);
  }, [expanded, initialVisible, options]);

  const hiddenCount = Math.max(0, options.length - initialVisible);

  if (options.length === 0) {
    return emptyLabel ? <p className="cat-filter-facet-empty">{emptyLabel}</p> : null;
  }

  return (
    <>
      <ul className="cat-filter-facet-list">
        {visibleOptions.map((option) => {
          const active = selected.includes(option.slug);
          return (
            <li key={option.slug}>
              <label className={`cat-filter-facet${active ? " cat-filter-facet--active" : ""}`}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onChange(toggleValue(selected, option.slug))}
                />
                <span className="cat-filter-facet__label">
                  {option.name}
                  <span className="cat-filter-facet__count">({option.count})</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {!expanded && hiddenCount > 0 ? (
        <button type="button" className="cat-filter-facet-more" onClick={() => setExpanded(true)}>
          + {hiddenCount} more
        </button>
      ) : null}
    </>
  );
});
