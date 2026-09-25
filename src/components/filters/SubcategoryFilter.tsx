"use client";

import { memo, useCallback } from "react";
import FacetCheckboxList, { type FacetOption } from "./FacetCheckboxList";
import FilterSection from "./FilterSection";

interface SubcategoryFilterProps {
  subcategories: FacetOption[];
  selected: string[];
  onChange: (subcategories: string[]) => void;
}

export default memo(function SubcategoryFilter({
  subcategories,
  selected,
  onChange,
}: SubcategoryFilterProps) {
  const handleChange = useCallback((next: string[]) => onChange(next), [onChange]);

  if (subcategories.length === 0) return null;

  return (
    <FilterSection title="Categories">
      <FacetCheckboxList options={subcategories} selected={selected} onChange={handleChange} />
    </FilterSection>
  );
});
