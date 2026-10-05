import { describe, expect, it } from "vitest";
import {
  deriveSubcategoryFromSpecs,
  resolveProductSubcategory,
} from "@/lib/product/resolveProductSubcategory";

describe("deriveSubcategoryFromSpecs", () => {
  it("prefers explicit subcategory specs over product type", () => {
    expect(
      deriveSubcategoryFromSpecs({ "Product Type": "Cymbal", Subcategory: "Crash Cymbal" }),
    ).toBe("Crash Cymbal");
  });

  it("reads Product Type from detail specs when specifications lack it", () => {
    expect(deriveSubcategoryFromSpecs({}, [{ label: "product type", value: "Drum Stick" }])).toBe(
      "Drum Stick",
    );
  });

  it("ignores values that only repeat the category", () => {
    expect(
      deriveSubcategoryFromSpecs(
        { "Product Type": "Drums & Percussion" },
        [],
        "Drums & Percussion",
      ),
    ).toBe("");
  });
});

describe("resolveProductSubcategory", () => {
  const taxonomy = [
    { subcategory: "Drum Sticks", productType: "Drumstick" },
    { subcategory: "Cymbals", productType: "Crash Cymbal" },
    { subcategory: "Multi-Effects Processors", productType: "Guitar Multi-Effects" },
  ];

  it("keeps the value entered in admin, normalized to the taxonomy name", () => {
    expect(
      resolveProductSubcategory({ subcategory: "drum stick", name: "Any", candidates: taxonomy }),
    ).toBe("Drum Sticks");
    expect(resolveProductSubcategory({ subcategory: "Practice Pad", name: "Any" })).toBe(
      "Practice Pad",
    );
  });

  it("maps a Product Type spec to its taxonomy subcategory", () => {
    expect(
      resolveProductSubcategory({
        subcategory: "",
        name: "AVUS ZAPCRASH 12",
        specifications: { "Product Type": "Crash Cymbal" },
        candidates: taxonomy,
      }),
    ).toBe("Cymbals");
  });

  it("falls back to the configured subcategory named in the product title", () => {
    expect(
      resolveProductSubcategory({
        subcategory: "",
        name: 'AVUS ORLIN 8" Professional Cymbal',
        categoryName: "Drums & Percussion",
        candidates: taxonomy,
      }),
    ).toBe("Cymbals");
    expect(
      resolveProductSubcategory({
        subcategory: "",
        name: "BOSS GX-100 Guitar Multi-Effects Processor",
        candidates: taxonomy,
      }),
    ).toBe("Multi-Effects Processors");
  });

  it("matches sibling subcategories by their leading segment", () => {
    expect(
      resolveProductSubcategory({
        subcategory: "",
        name: "AVUS Linage 5B Hickory Drumsticks - Natural",
        candidates: [
          { subcategory: "Drumsticks / Designer Drumsticks / Professional Percussion Sticks" },
        ],
      }),
    ).toBe("Drumsticks / Designer Drumsticks / Professional Percussion Sticks");
  });

  it("returns empty when nothing configured applies", () => {
    expect(
      resolveProductSubcategory({ subcategory: "", name: "Mystery Item", candidates: taxonomy }),
    ).toBe("");
  });
});
