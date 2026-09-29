import { describe, expect, it } from "vitest";
import type { BulkImportPreviewRow } from "@/types/catalog";
import { slimBulkImportPreviewRow } from "@/lib/admin/bulkImportResponse";

describe("bulkImportResponse", () => {
  it("strips heavy preview fields but keeps editable image metadata", () => {
    const row: BulkImportPreviewRow = {
      rowNumber: 2,
      name: "BOSS GX-100",
      brand: "BOSS",
      category: "Guitars",
      price: 37149,
      valid: true,
      action: "update",
      errors: [],
      description: "A".repeat(500),
      specifications: { ASIN: "B123" },
      detailSpecs: [{ label: "Color", value: "Black" }],
      resolvedImages: ["https://cdn.example/a.webp"],
      zipImageMatches: Array.from({ length: 7 }, (_, index) => `vm-boss-gx100_${index + 1}.jpg`),
    };

    const slim = slimBulkImportPreviewRow(row);
    expect(slim.description).toBeUndefined();
    expect(slim.specifications).toBeUndefined();
    expect(slim.detailSpecs).toBeUndefined();
    expect(slim.resolvedImages).toBeUndefined();
    expect(slim.zipImageMatches).toBeUndefined();
    expect(slim.imageCount).toBe(8);
    expect(slim.zipImageMatchPreview).toHaveLength(7);
    expect(slim.name).toBe("BOSS GX-100");
  });
});
