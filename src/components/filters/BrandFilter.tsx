"use client";

import { memo, useCallback } from "react";
import FacetCheckboxList, { type FacetOption } from "./FacetCheckboxList";
import FilterSection from "./FilterSection";

interface BrandFilterProps {
  brands: FacetOption[];
  selected: string[];
  onChange: (brands: string[]) => void;
}

export default memo(function BrandFilter({ brands, selected, onChange }: BrandFilterProps) {
  const handleChange = useCallback((next: string[]) => onChange(next), [onChange]);

  if (brands.length === 0) return null;

  return (
    <FilterSection title="Brands">
      <FacetCheckboxList options={brands} selected={selected} onChange={handleChange} />
    </FilterSection>
  );
});
