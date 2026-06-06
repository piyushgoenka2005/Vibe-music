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

export default function BrandFilter({
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
      {brands.map((brand) => (
        <label key={brand.slug} className="cat-filter-option">
          <input
            type="checkbox"
            checked={selected.includes(brand.slug)}
            onChange={() => toggle(brand.slug)}
          />
          <span>
            {brand.name} ({brand.count})
          </span>
        </label>
      ))}
    </FilterSection>
  );
}
