"use client";

import FilterSection from "./FilterSection";
import type { AvailabilityFilter as AvailabilityValue } from "@/types/filters";

const OPTIONS: { value: AvailabilityValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in-stock", label: "In Stock" },
  { value: "limited", label: "Limited Stock" },
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
      {OPTIONS.map((option) => (
        <label key={option.value} className="cat-filter-option">
          <input
            type="radio"
            name="availability-filter"
            checked={selected === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </FilterSection>
  );
}
