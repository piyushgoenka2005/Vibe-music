import { describe, expect, it } from "vitest";
import {
  BULK_IMPORT_IMAGE_FIELDS,
  collectBulkImportImageNames,
  getMaxBulkImportImages,
} from "@/lib/admin/bulkImportImages";
import type { BulkImportRow } from "@/types/catalog";

describe("bulkImportImages", () => {
  it("collects all editable image columns from a row", () => {
    const row: BulkImportRow = {
      name: "Test",
      brand: "Brand",
      category: "Guitars",
      price: 1000,
      image1: "a.jpg",
      image7: "g.jpg",
      image12: "l.jpg",
    };

    expect(collectBulkImportImageNames(row)).toEqual(["a.jpg", "g.jpg", "l.jpg"]);
    expect(BULK_IMPORT_IMAGE_FIELDS).toHaveLength(12);
  });

  it("respects MAX_BULK_IMPORT_IMAGES env override", () => {
    expect(getMaxBulkImportImages({ MAX_BULK_IMPORT_IMAGES: "7" })).toBe(7);
    expect(getMaxBulkImportImages({ MAX_BULK_IMPORT_IMAGES: "99" })).toBe(12);
  });
});
