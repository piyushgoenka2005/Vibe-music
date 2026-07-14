import { describe, expect, it } from "vitest";
import {
  canAddCompareItem,
  mergeCompareItems,
  normalizeCompareItems,
  collectSpecLabels,
} from "@/lib/compare/compareEngine";

describe("compareEngine", () => {
  it("normalizes and caps at 4 items", () => {
    const items = normalizeCompareItems(
      Array.from({ length: 6 }, (_, i) => ({
        productId: `p${i}`,
        slug: `slug-${i}`,
        name: `Product ${i}`,
        brand: "Brand",
        price: 1000,
        image: "",
        imageColor: "",
        addedAt: i,
      }))
    );
    expect(items).toHaveLength(4);
  });

  it("merges local and remote by newest addedAt", () => {
    const merged = mergeCompareItems(
      [{ productId: "a", slug: "a", name: "A", brand: "B", price: 1, image: "", imageColor: "", availability: "in-stock", rating: 0, reviewCount: 0, addedAt: 100 }],
      [{ productId: "a", slug: "a", name: "A2", brand: "B", price: 2, image: "", imageColor: "", availability: "in-stock", rating: 0, reviewCount: 0, addedAt: 200 }]
    );
    expect(merged[0].addedAt).toBe(200);
  });

  it("blocks add when full", () => {
    const items = normalizeCompareItems(
      Array.from({ length: 4 }, (_, i) => ({
        productId: `p${i}`,
        slug: `s${i}`,
        name: "N",
        brand: "B",
        price: 1,
        image: "",
        imageColor: "",
      }))
    );
    expect(canAddCompareItem(items, "new").ok).toBe(false);
  });

  it("collects unique spec labels", () => {
    const labels = collectSpecLabels({
      a: [{ label: "Weight", value: "1kg" }],
      b: [{ label: "Weight", value: "2kg" }, { label: "Color", value: "Red" }],
    });
    expect(labels).toEqual(["Weight", "Color"]);
  });
});
