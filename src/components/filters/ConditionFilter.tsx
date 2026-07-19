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
      <div className="cat-filter-pills" role="group" aria-label="Condition">
        {OPTIONS.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              className={`cat-filter-pill${active ? " cat-filter-pill--active" : ""}`}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </FilterSection>
  );
}
