import { describe, expect, it } from "vitest";
import type { BulkImportPreviewRow } from "@/types/catalog";
import { buildBulkImportPreviewSummary } from "@/lib/admin/bulkImportSummary";

describe("buildBulkImportPreviewSummary", () => {
  it("aggregates create, update, skip, and error counts", () => {
    const preview: BulkImportPreviewRow[] = [
      {
        name: "A",
        brand: "B",
        category: "Guitars",
        price: 100,
        rowNumber: 2,
        errors: [],
        valid: true,
        action: "create",
      },
      {
        name: "B",
        brand: "B",
        category: "Guitars",
        price: 200,
        rowNumber: 3,
        errors: [],
        valid: true,
        action: "update",
      },
      {
        name: "C",
        brand: "B",
        category: "Keys",
        price: 300,
        rowNumber: 4,
        errors: [],
        valid: true,
        action: "skip",
      },
      {
        name: "",
        brand: "B",
        category: "Keys",
        price: 0,
        rowNumber: 5,
        errors: ["ITEM TITLE is required"],
        valid: false,
      },
    ];

    const summary = buildBulkImportPreviewSummary(preview, 12);
    expect(summary.total).toBe(4);
    expect(summary.valid).toBe(3);
    expect(summary.invalid).toBe(1);
    expect(summary.creates).toBe(1);
    expect(summary.updates).toBe(1);
    expect(summary.skips).toBe(1);
    expect(summary.emptyRowsSkipped).toBe(12);
    expect(summary.categories.map((item) => item.name)).toEqual(["Guitars", "Keys"]);
  });
});
