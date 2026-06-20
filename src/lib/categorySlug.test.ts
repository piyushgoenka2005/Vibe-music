import { describe, expect, it } from "vitest";
import categoriesData from "@/data/catalog/categories.json";
import {
  findCategoryInList,
  normalizeCategorySlug,
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
});
