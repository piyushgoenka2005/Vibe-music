"use client";

import type { SortOption } from "@/types/filters";

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Highest Rated" },
];

interface SortDropdownProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <select
      className="cat-sort-select"
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      aria-label="Sort products"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
