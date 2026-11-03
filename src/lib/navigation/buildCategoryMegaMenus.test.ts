import { describe, expect, it } from "vitest";
import { buildCategoryMegaMenus } from "./buildCategoryMegaMenus";

describe("buildCategoryMegaMenus", () => {
  it("includes database-created categories and subcategories", () => {
    const menus = buildCategoryMegaMenus([
      { id: "cat-custom", name: "Synth Gear", slug: "synth-gear", sortOrder: 1 },
      {
        id: "sub-custom",
        name: "Modular Synths",
        slug: "synth-gear-modular-synths",
        parentId: "cat-custom",
        sortOrder: 1,
      },
    ]);

    expect(menus).toEqual([
      expect.objectContaining({
        name: "Synth Gear",
        href: "/category/synth-gear",
        columns: [
          expect.objectContaining({
            links: [{ label: "Modular Synths", href: "/category/synth-gear-modular-synths" }],
          }),
        ],
      }),
    ]);
  });

  it("uses the admin image for featured cards in an existing menu", () => {
    const imageUrl = "https://cdn.example.com/studio.jpg";
    const menus = buildCategoryMegaMenus([
      {
        id: "cat-studio",
        name: "Studio",
        slug: "studio-recording",
        imageUrl,
        sortOrder: 1,
      },
    ]);

    expect(menus[0]?.featured[0]?.image).toBe(imageUrl);
    expect(menus[0]?.featured[1]?.image).not.toBe(imageUrl);
  });

  it("uses independently configured images for each featured card", () => {
    const featuredImageUrls = [
      "https://cdn.example.com/one.jpg",
      "https://cdn.example.com/two.jpg",
    ];
    const menus = buildCategoryMegaMenus([
      {
        id: "cat-studio",
        name: "Studio",
        slug: "studio-recording",
        featuredImageUrls,
        sortOrder: 1,
      },
    ]);

    expect(menus[0]?.featured.map((card) => card.image)).toEqual(featuredImageUrls);
  });
});
