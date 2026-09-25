"use client";

import { memo, useCallback } from "react";
import FacetCheckboxList, { type FacetOption } from "./FacetCheckboxList";
import FilterSection from "./FilterSection";

interface CategoryFacetFilterProps {
  categories: FacetOption[];
  selected: string[];
  onChange: (categories: string[]) => void;
}

export default memo(function CategoryFacetFilter({
  categories,
  selected,
  onChange,
}: CategoryFacetFilterProps) {
  const handleChange = useCallback((next: string[]) => onChange(next), [onChange]);

  if (categories.length === 0) return null;

  return (
    <FilterSection title="Categories">
      <FacetCheckboxList options={categories} selected={selected} onChange={handleChange} />
    </FilterSection>
  );
});
