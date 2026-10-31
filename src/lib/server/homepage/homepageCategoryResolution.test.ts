import { describe, expect, it } from "vitest";
import type { Category } from "@/types/category";

function filterPopularCategories(categories: Category[], maxItems: number = 8) {
  const featured = categories.filter((category) => category.isFeatured && !category.parentId);
  const pool = featured.length > 0 ? featured : categories.filter((category) => !category.parentId);

  return pool.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)).slice(0, maxItems);
}

describe("Popular Categories resolution", () => {
  const sampleCategories: Category[] = [
    {
      id: "cat-1",
      name: "Guitars",
      slug: "guitars",
      parentId: null,
      isFeatured: true,
      sortOrder: 1,
    },
    {
      id: "cat_guitars-electric",
      name: "Electric Guitar",
      slug: "guitars-electric",
      parentId: "cat-1",
      isFeatured: true, // Even if marked featured, as a subcategory it must not leak onto homepage Popular Categories
      sortOrder: 1,
    },
    {
      id: "cat_guitars-acoustic",
      name: "Acoustic Guitar",
      slug: "guitars-acoustic",
      parentId: "cat-1",
      isFeatured: false,
      sortOrder: 2,
    },
    {
      id: "cat-2",
      name: "Studio & Recording",
      slug: "studio-recording",
      parentId: null,
      isFeatured: true,
      sortOrder: 2,
    },
    {
      id: "cat-3",
      name: "Drums & Percussion",
      slug: "drums-percussion",
      parentId: null,
      isFeatured: true,
      sortOrder: 3,
    },
  ];

  it("only includes top-level categories and excludes subcategories from popular categories strip", () => {
    const resolved = filterPopularCategories(sampleCategories, 8);
    const slugs = resolved.map((c) => c.slug);

    expect(slugs).toContain("guitars");
    expect(slugs).toContain("studio-recording");
    expect(slugs).toContain("drums-percussion");
    expect(slugs).not.toContain("guitars-electric");
    expect(slugs).not.toContain("guitars-acoustic");
  });

  it("handles fallback to top-level categories if none are explicitly featured", () => {
    const unfeaturedCategories: Category[] = [
      {
        id: "c1",
        name: "Guitars",
        slug: "guitars",
        parentId: null,
        isFeatured: false,
        sortOrder: 1,
      },
      {
        id: "c1-sub",
        name: "Electric Guitar",
        slug: "guitars-electric",
        parentId: "c1",
        isFeatured: false,
        sortOrder: 1,
      },
      { id: "c2", name: "Bass", slug: "bass", parentId: null, isFeatured: false, sortOrder: 2 },
    ];

    const resolved = filterPopularCategories(unfeaturedCategories, 8);
    const slugs = resolved.map((c) => c.slug);

    expect(slugs).toEqual(["guitars", "bass"]);
    expect(slugs).not.toContain("guitars-electric");
  });
});
