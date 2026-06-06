"use client";

import type { CategoryFilters } from "@/types/filters";
import { unslugify } from "@/lib/slug";

interface FilterChipsProps {
  filters: CategoryFilters;
  onRemoveBrand: (slug: string) => void;
  onRemoveCondition: (condition: CategoryFilters["conditions"][number]) => void;
  onUpdate: (patch: Partial<CategoryFilters>) => void;
  onClearAll: () => void;
}

export default function FilterChips({
  filters,
  onRemoveBrand,
  onRemoveCondition,
  onUpdate,
  onClearAll,
}: FilterChipsProps) {
  const chips: Array<{ key: string; label: string; onRemove: () => void }> =
    [];

  filters.brands.forEach((slug) => {
    chips.push({
      key: `brand-${slug}`,
      label: unslugify(slug),
      onRemove: () => onRemoveBrand(slug),
    });
  });

  if (filters.minPrice !== null) {
    chips.push({
      key: "min-price",
      label: `Min $${filters.minPrice}`,
      onRemove: () => onUpdate({ minPrice: null }),
    });
  }

  if (filters.maxPrice !== null) {
    chips.push({
      key: "max-price",
      label: `Max $${filters.maxPrice}`,
      onRemove: () => onUpdate({ maxPrice: null }),
    });
  }

  if (filters.rating !== null) {
    chips.push({
      key: "rating",
      label: `${filters.rating}+ stars`,
      onRemove: () => onUpdate({ rating: null }),
    });
  }

  if (filters.availability !== "all") {
    chips.push({
      key: "availability",
      label: filters.availability.replace(/-/g, " "),
      onRemove: () => onUpdate({ availability: "all" }),
    });
  }

  filters.conditions.forEach((condition) => {
    chips.push({
      key: `condition-${condition}`,
      label: condition.replace(/-/g, " "),
      onRemove: () => onRemoveCondition(condition),
    });
  });

  if (chips.length === 0) return null;

  return (
    <div className="cat-filter-chips" role="list" aria-label="Active filters">
      {chips.map((chip) => (
        <span key={chip.key} className="cat-filter-chip" role="listitem">
          {chip.label}
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter`}
            onClick={chip.onRemove}
          >
            ×
          </button>
        </span>
      ))}
      <button type="button" className="cat-filter-clear" onClick={onClearAll}>
        Clear All
      </button>
    </div>
  );
}
