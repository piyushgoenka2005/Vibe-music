import { describe, expect, it } from "vitest";
import {
  buildCategoryFilteredMetadata,
  resolveAdLandingRedirect,
  resolveSearchPageRedirect,
  resolveSearchResultsRedirect,
} from "@/lib/seo/adLanding";

describe("adLanding redirects", () => {
  it("redirects brand-only search results to canonical brand pages", () => {
    expect(resolveSearchResultsRedirect({ brand: "gibraltar" })).toBe("/brands/gibraltar");
  });

  it("redirects category-only search results to category pages", () => {
    expect(resolveSearchResultsRedirect({ category: "drums-percussion" })).toBe(
      "/category/drums-percussion",
    );
  });

  it("redirects brand + category filters to category pages", () => {
    expect(resolveSearchResultsRedirect({ brand: "gibraltar", category: "drums-percussion" })).toBe(
      "/category/drums-percussion?brand=gibraltar",
    );
  });

  it("keeps text search on search results", () => {
    expect(resolveSearchResultsRedirect({ q: "drum kit", brand: "gibraltar" })).toBeNull();
  });

  it("redirects legacy /search?brand= links", () => {
    expect(resolveSearchPageRedirect({ brand: "hertz" })).toBe("/brands/hertz");
  });

  it("resolves edge redirects for legacy ad landing paths", () => {
    const gibraltar = new URLSearchParams({ brand: "gibraltar" });
    expect(resolveAdLandingRedirect("/brands", gibraltar)).toBe("/brands/gibraltar");
    expect(resolveAdLandingRedirect("/search/results", gibraltar)).toBe("/brands/gibraltar");
    expect(resolveAdLandingRedirect("/search", gibraltar)).toBe("/brands/gibraltar");
  });
});

describe("buildCategoryFilteredMetadata", () => {
  it("includes brand and subcategory in title and canonical URL", () => {
    const metadata = buildCategoryFilteredMetadata({
      categoryName: "Drums & Percussion",
      categorySlug: "drums-percussion",
      brandName: "GIBRALTAR",
      brandSlug: "gibraltar",
      subcategoryRaw: "DRUM HARDWARE",
      searchParams: { brand: "gibraltar", subcat: "drum-hardware" },
    });
    expect(metadata.title).toContain("GIBRALTAR");
    expect(metadata.alternates?.canonical).toContain("/category/drums-percussion?brand=gibraltar");
  });
});
