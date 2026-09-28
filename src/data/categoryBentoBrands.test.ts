import { describe, expect, it } from "vitest";
import { CATEGORY_BENTO_ITEMS } from "@/data/categoryBento";
import { catalogBrandsForCategory } from "@/data/categoryBentoBrands";

describe("categoryBentoBrands", () => {
  it("derives brands from the catalogue for guitars", () => {
    expect(catalogBrandsForCategory("guitars")).toBe("HERTZ");
  });

  it("keeps bento tiles aligned with catalogue brands only", () => {
    for (const item of CATEGORY_BENTO_ITEMS) {
      if (!item.brands) continue;
      const expected = catalogBrandsForCategory(item.slug);
      expect(item.brands).toBe(expected);
    }
  });

  it("does not surface brands absent from the catalogue", () => {
    const banned = ["Yamaha", "Fender", "Gibson", "QSC", "Shure", "Sennheiser"];
    for (const item of CATEGORY_BENTO_ITEMS) {
      if (!item.brands) continue;
      for (const brand of banned) {
        expect(item.brands).not.toContain(brand);
      }
    }
  });
});
