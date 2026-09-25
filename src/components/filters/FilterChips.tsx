"use client";

import type { CategoryFilters, SpecFacetGroup } from "@/types/filters";
import { unslugify } from "@/lib/slug";

interface FilterChipsProps {
  filters: CategoryFilters;
  facetLabels?: {
    brands?: Record<string, string>;
    categories?: Record<string, string>;
    subcategories?: Record<string, string>;
    specs?: SpecFacetGroup[];
  };
  onRemoveBrand: (slug: string) => void;
  onRemoveCategory: (slug: string) => void;
  onRemoveSubcategory: (slug: string) => void;
  onRemoveSpec: (label: string, valueSlug: string) => void;
  onRemoveCondition: (condition: CategoryFilters["conditions"][number]) => void;
  onUpdate: (patch: Partial<CategoryFilters>) => void;
  onClearAll: () => void;
}

function resolveSpecLabel(
  groups: SpecFacetGroup[] | undefined,
  label: string,
  valueSlug: string,
): string {
  const group = groups?.find((entry) => entry.label === label);
  const option = group?.options.find((entry) => entry.slug === valueSlug);
  return option?.name ?? valueSlug.replace(/-/g, " ");
}

export default function FilterChips({
  filters,
  facetLabels,
  onRemoveBrand,
  onRemoveCategory,
  onRemoveSubcategory,
  onRemoveSpec,
  onRemoveCondition,
  onUpdate,
  onClearAll,
}: FilterChipsProps) {
  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  filters.brands.forEach((slug) => {
    chips.push({
      key: `brand-${slug}`,
      label: facetLabels?.brands?.[slug] ?? unslugify(slug),
      onRemove: () => onRemoveBrand(slug),
    });
  });

  filters.categories.forEach((slug) => {
    chips.push({
      key: `category-${slug}`,
      label: facetLabels?.categories?.[slug] ?? unslugify(slug),
      onRemove: () => onRemoveCategory(slug),
    });
  });

  filters.subcategories.forEach((slug) => {
    chips.push({
      key: `subcategory-${slug}`,
      label: facetLabels?.subcategories?.[slug] ?? unslugify(slug),
      onRemove: () => onRemoveSubcategory(slug),
    });
  });

  Object.entries(filters.specs).forEach(([label, values]) => {
    values.forEach((valueSlug) => {
      chips.push({
        key: `spec-${label}-${valueSlug}`,
        label: `${label}: ${resolveSpecLabel(facetLabels?.specs, label, valueSlug)}`,
        onRemove: () => onRemoveSpec(label, valueSlug),
      });
    });
  });

  if (filters.minPrice !== null) {
    chips.push({
      key: "min-price",
      label: `Min ₹${filters.minPrice}`,
      onRemove: () => onUpdate({ minPrice: null }),
    });
  }

  if (filters.maxPrice !== null) {
    chips.push({
      key: "max-price",
      label: `Max ₹${filters.maxPrice}`,
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
          <button type="button" aria-label={`Remove ${chip.label} filter`} onClick={chip.onRemove}>
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
