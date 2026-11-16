import { describe, expect, it } from "vitest";
import {
  filtersToSearchParams,
  mergeCategoryFilters,
  normalizeCategoryFilters,
  parseFiltersFromSearchParams,
} from "@/lib/filterUrl";
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

  it("correctly parses page from search params and handles invalid/missing values", () => {
    const p1 = parseFiltersFromSearchParams(new URLSearchParams(""));
    expect(p1.page).toBe(1);

    const p2 = parseFiltersFromSearchParams(new URLSearchParams("page=2"));
    expect(p2.page).toBe(2);

    const p7 = parseFiltersFromSearchParams(new URLSearchParams("page=7"));
    expect(p7.page).toBe(7);

    const pInvalid = parseFiltersFromSearchParams(new URLSearchParams("page=-5"));
    expect(pInvalid.page).toBe(1);

    const pNonNumeric = parseFiltersFromSearchParams(new URLSearchParams("page=abc"));
    expect(pNonNumeric.page).toBe(1);
  });

  it("serializes page correctly to search params (omits for page=1, preserves for page>1)", () => {
    const params1 = filtersToSearchParams({ ...DEFAULT_FILTERS, page: 1 });
    expect(params1.get("page")).toBeNull();

    const params2 = filtersToSearchParams({ ...DEFAULT_FILTERS, page: 2 });
    expect(params2.get("page")).toBe("2");

    const params7 = filtersToSearchParams({ ...DEFAULT_FILTERS, page: 7 });
    expect(params7.get("page")).toBe("7");
  });
});
