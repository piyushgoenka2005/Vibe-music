"use client";

import { memo } from "react";
import FacetCheckboxList from "./FacetCheckboxList";
import FilterSection from "./FilterSection";
import type { SpecFacetGroup } from "@/types/filters";

interface SpecificationFilterProps {
  groups: SpecFacetGroup[];
  selected: Record<string, string[]>;
  onChange: (specs: Record<string, string[]>) => void;
}

export default memo(function SpecificationFilter({
  groups,
  selected,
  onChange,
}: SpecificationFilterProps) {
  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group) => (
        <FilterSection key={group.key} title={group.label}>
          <FacetCheckboxList
            options={group.options}
            selected={selected[group.label] ?? []}
            onChange={(next) => {
              const updated = { ...selected };
              if (next.length) updated[group.label] = next;
              else delete updated[group.label];
              onChange(updated);
            }}
            initialVisible={6}
          />
        </FilterSection>
      ))}
    </>
  );
});
