"use client";

import FilterSection from "./FilterSection";
import type { AvailabilityFilter as AvailabilityValue } from "@/types/filters";

const OPTIONS: { value: AvailabilityValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in-stock", label: "In Stock" },
  { value: "limited", label: "Limited" },
  { value: "out-of-stock", label: "Out of Stock" },
];

interface AvailabilityFilterProps {
  selected: AvailabilityValue;
  onChange: (value: AvailabilityValue) => void;
}

export default function AvailabilityFilter({
  selected,
  onChange,
}: AvailabilityFilterProps) {
  return (
    <FilterSection title="Availability">
      <div className="cat-filter-pills" role="radiogroup" aria-label="Availability">
        {OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`cat-filter-pill${active ? " cat-filter-pill--active" : ""}`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </FilterSection>
  );
}
