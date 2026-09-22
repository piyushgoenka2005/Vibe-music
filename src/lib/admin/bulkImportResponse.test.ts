import { describe, expect, it } from "vitest";
import type { BulkImportPreviewRow } from "@/types/catalog";
import { slimBulkImportPreviewRow } from "@/lib/admin/bulkImportResponse";

describe("bulkImportResponse", () => {
  it("strips heavy preview fields for large uploads", () => {
    const row: BulkImportPreviewRow = {
      rowNumber: 2,
      name: "Zoom G1X",
      brand: "Zoom",
      category: "Studio & Recording",
      price: 12999,
      valid: true,
      action: "create",
      errors: [],
      description: "A".repeat(500),
      specifications: { ASIN: "B123" },
      detailSpecs: [{ label: "Color", value: "Black" }],
      resolvedImages: ["https://cdn.example/a.webp"],
    };

    const slim = slimBulkImportPreviewRow(row);
    expect(slim.description).toBeUndefined();
    expect(slim.specifications).toBeUndefined();
    expect(slim.detailSpecs).toBeUndefined();
    expect(slim.resolvedImages).toEqual(["1 image(s)"]);
    expect(slim.name).toBe("Zoom G1X");
  });
});
