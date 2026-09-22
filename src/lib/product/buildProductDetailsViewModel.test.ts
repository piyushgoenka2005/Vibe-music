import { describe, expect, it } from "vitest";
import { buildProductDetailsViewModel } from "./buildProductDetailsViewModel";
import type { ProductDetail } from "@/types/product";

function makeProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "p1",
    slug: "test-product",
    name: "Test Product",
    brand: "Yamaha",
    brandSlug: "yamaha",
    category: "Keyboards",
    categorySlug: "keyboards",
    price: 1000,
    rating: 4.5,
    reviewCount: 10,
    availability: "in-stock",
    condition: "new",
    imageColor: "#000",
    image: "/test.jpg",
    sku: "SKU-1",
    msrp: 1200,
    salePrice: 1000,
    description: "First bullet\nSecond bullet",
    specs: [],
    inTheBox: [],
    images: [],
    videos: [],
    variants: [],
    reviews: [],
    qa: [],
    frequentlyBoughtTogether: [],
    similarProductIds: [],
    relatedProductIds: [],
    ...overrides,
  };
}

describe("buildProductDetailsViewModel", () => {
  it("builds about items from description bullets", () => {
    const model = buildProductDetailsViewModel(makeProduct());

    expect(model.aboutItems).toEqual([
      { title: "", body: "First bullet" },
      { title: "", body: "Second bullet" },
    ]);
    expect(model.completeSpecs.length).toBeGreaterThan(0);
    expect(model.hasAnyContent).toBe(true);
  });

  it("excludes size, material, and style specs from expanded groups", () => {
    const model = buildProductDetailsViewModel(
      makeProduct({
        specs: [
          { label: "Size", value: "Full" },
          { label: "Finish Type", value: "Gloss" },
          { label: "Style", value: "2026" },
          { label: "Warranty", value: "1 Year" },
          { label: "Connectivity", value: "Bluetooth" },
        ],
      }),
    );

    expect(model.sizeAndFitSpecs).toEqual([{ label: "Size", value: "Full" }]);
    expect(model.materialAndCareSpecs).toEqual([{ label: "Finish Type", value: "Gloss" }]);
    expect(model.styleSpec).toEqual({ label: "Style", value: "2026" });
    expect(model.quickSpecs.map((spec) => spec.label)).not.toContain("Style");

    const expandedLabels = model.expandedGroups.flatMap((group) =>
      group.specs.map((spec) => spec.label),
    );
    expect(expandedLabels).not.toContain("Size");
    expect(expandedLabels).not.toContain("Finish Type");
    expect(expandedLabels).not.toContain("Style");
    expect(expandedLabels).toContain("Warranty");
    expect(expandedLabels).toContain("Connectivity");
  });

  it("treats in-the-box as expanded content", () => {
    const model = buildProductDetailsViewModel(
      makeProduct({
        description: "",
        inTheBox: ["Main unit", "Power cable"],
      }),
    );

    expect(model.hasExpandedContent).toBe(true);
    expect(model.inTheBox).toEqual(["Main unit", "Power cable"]);
    expect(model.hasAnyContent).toBe(true);
  });

  it("enriches metadata even when detail specs are sparse", () => {
    const model = buildProductDetailsViewModel(
      makeProduct({
        description: "",
        specs: [],
        inTheBox: [],
      }),
    );

    expect(model.hasAnyContent).toBe(true);
    expect(model.completeSpecs.map((spec) => spec.label)).toEqual(
      expect.arrayContaining(["Brand", "SKU", "Category", "Availability", "Condition"]),
    );
  });

  it("maps structured feature sections into about items", () => {
    const model = buildProductDetailsViewModel(
      makeProduct({
        description:
          "Premium sound for live performance.\n\nDeep Bass\nRich low-end response for live performance.",
      }),
    );

    expect(model.introBlocks).toHaveLength(1);
    expect(model.aboutItems).toEqual([
      {
        title: "Deep Bass",
        body: "Rich low-end response for live performance.",
      },
    ]);
  });

  it("supports specs-only products with brand in quick preview", () => {
    const model = buildProductDetailsViewModel(
      makeProduct({
        description: "",
        specs: [{ label: "Number of Keys", value: "88" }],
      }),
    );

    expect(model.hasAnyContent).toBe(true);
    expect(model.quickSpecs[0]).toEqual({ label: "Brand", value: "Yamaha" });
    expect(model.quickSpecs[1]).toEqual({ label: "Number of Keys", value: "88" });
    expect(model.completeSpecs.length).toBeGreaterThan(2);
    expect(model.hasExpandedContent).toBe(true);
  });

  it("enriches sparse catalog rows into multiple accordion groups", () => {
    const model = buildProductDetailsViewModel(
      makeProduct({
        description: "",
        subcategory: "Stage Piano",
        specs: [
          { label: "Keys", value: "88" },
          { label: "Action", value: "Fully weighted hammer action" },
          { label: "Product Type", value: "Stage Piano" },
        ],
      }),
    );

    expect(model.expandedGroups.map((group) => group.id)).toContain("keyboard-performance");
    expect(model.completeSpecs.length).toBeGreaterThanOrEqual(8);
  });
});
