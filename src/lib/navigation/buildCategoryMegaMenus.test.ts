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
});
