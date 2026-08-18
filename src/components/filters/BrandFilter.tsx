"use client";

import FilterSection from "./FilterSection";

interface BrandFacet {
  slug: string;
  name: string;
  count: number;
}

interface BrandFilterProps {
  brands: BrandFacet[];
  selected: string[];
  onChange: (brands: string[]) => void;
}

import { memo } from "react";

export default memo(function BrandFilter({
  brands,
  selected,
  onChange,
}: BrandFilterProps) {
  if (brands.length === 0) return null;

  function toggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((b) => b !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  return (
    <FilterSection title="Brand">
      <div className="cat-filter-brand-list">
        {brands.map((brand) => {
          const active = selected.includes(brand.slug);
          return (
            <label
              key={brand.slug}
              className={`cat-filter-brand${active ? " cat-filter-brand--active" : ""}`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggle(brand.slug)}
              />
              <span className="cat-filter-brand__name">{brand.name}</span>
              <span className="cat-filter-brand__count">{brand.count}</span>
            </label>
          );
        })}
      </div>
    </FilterSection>
  );
});
