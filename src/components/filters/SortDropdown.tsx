"use client";

import { ChevronDown } from "lucide-react";
import type { SortOption } from "@/types/filters";

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Newest" },
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
    <label className="cat-sort">
      <span className="cat-sort__label">Sort</span>
      <span className="cat-sort__control">
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
        <ChevronDown
          className="cat-sort__chevron"
          size={16}
          strokeWidth={2.25}
          aria-hidden
        />
      </span>
    </label>
  );
}
