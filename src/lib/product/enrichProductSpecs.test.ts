import { describe, expect, it } from "vitest";
import { enrichProductSpecs } from "./enrichProductSpecs";
import type { ProductDetail } from "@/types/product";

function makeProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "p1",
    slug: "test-product",
    name: "Test Product",
    brand: "Nord",
    brandSlug: "nord",
    category: "Keyboards & Synthesizers",
    categorySlug: "keyboards-synthesizers",
    subcategory: "Stage Piano",
    price: 449999,
    rating: 4.5,
    reviewCount: 0,
    availability: "in-stock",
    condition: "new",
    imageColor: "#000",
    image: "/test.jpg",
    sku: "VM-NORD-STAGE4-88",
    msrp: 499999,
    salePrice: 449999,
    gstRate: 18,
    description: "Flagship stage keyboard.",
    specs: [
      { label: "Keys", value: "88" },
      { label: "Action", value: "Fully weighted hammer action" },
    ],
    inTheBox: [],
    images: [],
    videos: [],
    variants: [
      {
        id: "var-default",
        label: "88-key",
        sku: "VM-NORD-STAGE4-88",
        price: 449999,
        stock: 6,
        availability: "in-stock",
        attributes: [{ type: "size", name: "Size", value: "88-key" }],
        images: [],
        isDefault: true,
      },
    ],
    reviews: [],
    qa: [],
    frequentlyBoughtTogether: [],
    similarProductIds: [],
    relatedProductIds: [],
    ...overrides,
  };
}

describe("enrichProductSpecs", () => {
  it("adds catalog metadata and variant attributes without overwriting existing specs", () => {
    const specs = enrichProductSpecs(makeProduct());
    const labels = specs.map((spec) => spec.label);

    expect(labels).toContain("Keys");
    expect(labels).toContain("Subcategory");
    expect(labels).toContain("GST Rate");
    expect(labels).toContain("Variant");
    expect(labels).toContain("Size");
    expect(specs.find((spec) => spec.label === "Keys")?.value).toBe("88");
  });
});
