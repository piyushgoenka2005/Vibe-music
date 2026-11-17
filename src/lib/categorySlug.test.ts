import { describe, expect, it } from "vitest";
import categoriesData from "@/data/catalog/categories.json";
import {
  collectCategoryRouteSlugs,
  findCategoryInList,
  isCanonicalCategorySlug,
  normalizeCategorySlug,
  resolveCategory,
  resolveRootCategory,
} from "@/lib/categorySlug";
import type { Category } from "@/types/category";

const categories = categoriesData as Category[];

describe("normalizeCategorySlug", () => {
  it("lowercases and hyphenates", () => {
    expect(normalizeCategorySlug("Guitars")).toBe("guitars");
    expect(normalizeCategorySlug("  GUITARS  ")).toBe("guitars");
    expect(normalizeCategorySlug("Drums & Percussion")).toBe("drums-percussion");
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
    expect(findCategoryInList(categories, "drums")?.slug).toBe("drums-percussion");
    expect(findCategoryInList(categories, "keys")?.slug).toBe("keyboards-synthesizers");
    expect(findCategoryInList(categories, "software")?.slug).toBe("software-plug-ins");
    expect(findCategoryInList(categories, "accessories")?.slug).toBe("cables-cases-accessories");
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

describe("resolveRootCategory", () => {
  it("resolves direct root category by slug or name", () => {
    const bySlug = resolveRootCategory(categories, { categorySlug: "guitars" });
    expect(bySlug?.slug).toBe("guitars");
    expect(bySlug?.parentId).toBeFalsy();

    const byName = resolveRootCategory(categories, { category: "Guitars" });
    expect(byName?.slug).toBe("guitars");
  });

  it("resolves child category to its root parent category", () => {
    // Acoustic Guitars has parentId pointing to Guitars
    const acoustic = categories.find(
      (c) => c.name.toLowerCase().includes("acoustic") && c.parentId,
    );
    if (acoustic) {
      const resolved = resolveRootCategory(categories, {
        categorySlug: acoustic.slug,
        category: acoustic.name,
      });
      expect(resolved?.slug).toBe("guitars");
      expect(resolved?.parentId).toBeFalsy();
    }
  });

  it("resolves portable keyboard metadata to Keyboards & Synthesizers / Pianos", () => {
    const resolved = resolveRootCategory(categories, {
      categorySlug: "keyboards-portable-keyboards",
      category: "Portable Keyboards",
      subcategory: "Portable Keyboards",
      name: "AEDON AX KB-36 Portable Electronic Keyboard",
    });
    expect(resolved).toBeDefined();
    expect(["keyboards-synthesizers", "keyboards-pianos"]).toContain(resolved?.slug);
    expect(resolved?.parentId).toBeFalsy();
  });

  it("resolves from subcategory or keyword when category is empty", () => {
    const fromSub = resolveRootCategory(categories, {
      subcategory: "Portable Keyboards",
    });
    expect(fromSub).toBeDefined();
    expect(["keyboards-synthesizers", "keyboards-pianos"]).toContain(fromSub?.slug);

    const fromKeyword = resolveRootCategory(categories, {
      name: "Fender Player Stratocaster Electric Guitar",
    });
    expect(fromKeyword?.slug).toBe("guitars");
  });
});
