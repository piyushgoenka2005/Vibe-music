import { describe, expect, it } from "vitest";
import { mergeCategoryFilters, normalizeCategoryFilters } from "@/lib/filterUrl";
import { DEFAULT_FILTERS } from "@/types/filters";

describe("filterUrl", () => {
  it("clears nullable price and rating fields when set to null", () => {
    const current = normalizeCategoryFilters({
      ...DEFAULT_FILTERS,
      minPrice: 5000,
      maxPrice: 10000,
      rating: 4,
    });

    const next = mergeCategoryFilters(current, {
      minPrice: null,
      maxPrice: null,
      rating: null,
    });

    expect(next.minPrice).toBeNull();
    expect(next.maxPrice).toBeNull();
    expect(next.rating).toBeNull();
  });

  it("does not leave undefined nullable fields after merge", () => {
    const next = mergeCategoryFilters(DEFAULT_FILTERS, {
      minPrice: undefined,
      maxPrice: undefined,
    });

    expect(next.minPrice).toBeNull();
    expect(next.maxPrice).toBeNull();
  });
});
