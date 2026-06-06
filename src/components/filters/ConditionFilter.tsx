"use client";

import FilterSection from "./FilterSection";
import type { ProductConditionFilter } from "@/types/filters";

const OPTIONS: { value: ProductConditionFilter; label: string }[] = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "open-box", label: "Open Box" },
];

interface ConditionFilterProps {
  selected: ProductConditionFilter[];
  onChange: (conditions: ProductConditionFilter[]) => void;
}

export default function ConditionFilter({
  selected,
  onChange,
}: ConditionFilterProps) {
  function toggle(value: ProductConditionFilter) {
    if (selected.includes(value)) {
      onChange(selected.filter((c) => c !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <FilterSection title="Condition">
      {OPTIONS.map((option) => (
        <label key={option.value} className="cat-filter-option">
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => toggle(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </FilterSection>
  );
}
