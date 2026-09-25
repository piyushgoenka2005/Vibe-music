import { describe, expect, it } from "vitest";
import {
  clampHomepageMaxItems,
  HOMEPAGE_BRAND_STRIP_MAX_ITEMS,
  HOMEPAGE_PRODUCT_SECTION_MAX_ITEMS,
} from "@/lib/homepage/homepageLimits";

describe("clampHomepageMaxItems (L-11)", () => {
  it("caps product carousels and deals at 8 even when CMS requests more", () => {
    expect(clampHomepageMaxItems("product_carousel", 16)).toBe(HOMEPAGE_PRODUCT_SECTION_MAX_ITEMS);
    expect(clampHomepageMaxItems("deals_slider", 12)).toBe(HOMEPAGE_PRODUCT_SECTION_MAX_ITEMS);
    expect(clampHomepageMaxItems("product_grid", 20)).toBe(HOMEPAGE_PRODUCT_SECTION_MAX_ITEMS);
  });

  it("caps brand strip separately from product sections", () => {
    expect(clampHomepageMaxItems("brand_strip", 16)).toBe(HOMEPAGE_BRAND_STRIP_MAX_ITEMS);
  });

  it("preserves counts within budget", () => {
    expect(clampHomepageMaxItems("product_carousel", 6)).toBe(6);
  });
});
