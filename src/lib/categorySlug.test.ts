import { describe, expect, it } from "vitest";
import categoriesData from "@/data/catalog/categories.json";
import {
  collectCategoryRouteSlugs,
  findCategoryInList,
  isCanonicalCategorySlug,
  normalizeCategorySlug,
  resolveCategory,
} from "@/lib/categorySlug";
import type { Category } from "@/types/category";

const categories = categoriesData as Category[];

describe("normalizeCategorySlug", () => {
  it("lowercases and hyphenates", () => {
    expect(normalizeCategorySlug("Guitars")).toBe("guitars");
    expect(normalizeCategorySlug("  GUITARS  ")).toBe("guitars");
    expect(normalizeCategorySlug("Drums & Percussion")).toBe(
      "drums-percussion"
    );
  });
});

describe("findCategoryInList", () => {
  it("matches canonical and plural slugs", () => {
    expect(findCategoryInList(categories, "guitars")?.slug).toBe("guitars");
    expect(findCategoryInList(categories, "guitar")?.slug).toBe("guitars");
    expect(findCategoryInList(categories, "GUITARS")?.slug).toBe("guitars");
    expect(findCategoryInList(categories, "Guitars")?.slug).toBe("guitars");
  });

  it("matches common shorthand aliases", () => {
    expect(findCategoryInList(categories, "drums")?.slug).toBe(
      "drums-percussion"
    );
    expect(findCategoryInList(categories, "keys")?.slug).toBe(
      "keyboards-synthesizers"
    );
    expect(findCategoryInList(categories, "software")?.slug).toBe(
      "software-plug-ins"
    );
    expect(findCategoryInList(categories, "accessories")?.slug).toBe(
      "cables-cases-accessories"
    );
  });

  it("resolveCategory is an alias for findCategoryInList", () => {
    expect(resolveCategory(categories, "drums")?.slug).toBe("drums-percussion");
  });
});

describe("collectCategoryRouteSlugs", () => {
  it("includes canonical slugs and common aliases", () => {
    const slugs = collectCategoryRouteSlugs(categories);
    expect(slugs).toContain("guitars");
    expect(slugs).toContain("guitar");
    expect(slugs).toContain("drums");
    expect(slugs).toContain("keys");
  });
});

describe("isCanonicalCategorySlug", () => {
  it("detects canonical vs alias slugs", () => {
    const guitars = categories.find((c) => c.slug === "guitars")!;
    expect(isCanonicalCategorySlug(guitars, "guitars")).toBe(true);
    expect(isCanonicalCategorySlug(guitars, "GUITARS")).toBe(true);
    expect(isCanonicalCategorySlug(guitars, "guitar")).toBe(false);
  });
});
