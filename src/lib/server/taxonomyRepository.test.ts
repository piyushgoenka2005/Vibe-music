import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseTaxonomyBuffer } from "@/lib/server/taxonomyRepository";

describe("taxonomyRepository", () => {
  it("parses Excel buffer and deduplicates repeated rows", () => {
    // Construct a mock workbook in memory with duplicated rows
    const data = [
      [
        "Category",
        "Subcategory",
        "Variant",
        "Product Type",
        "Instrument Family",
        "SEO Slug",
        "Google Product Category",
        "Menu Level 1",
        "Menu Level 2",
        "Menu Level 3",
      ],
      [
        "Guitars",
        "Acoustic",
        "Beginner Black",
        "Dreadnought",
        "Guitars",
        "guitars-acoustic-dreadnought-beginner",
        "Guitars > Acoustic > Dreadnought",
        "Guitars",
        "Acoustic",
        "Dreadnought",
      ],
      // Exact duplicate
      [
        "Guitars",
        "Acoustic",
        "Beginner Black",
        "Dreadnought",
        "Guitars",
        "guitars-acoustic-dreadnought-beginner",
        "Guitars > Acoustic > Dreadnought",
        "Guitars",
        "Acoustic",
        "Dreadnought",
      ],
      // Distinct row
      [
        "Keyboards",
        "Synthesizers",
        "Live Silver",
        "Analog Synth",
        "Keyboards",
        "keyboards-synthesizers-analog-live",
        "Keyboards > Synthesizers",
        "Keyboards",
        "Synthesizers",
        "Analog",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MasterTaxonomy");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const result = parseTaxonomyBuffer(buffer);

    expect(result.totalRowsRead).toBe(3);
    expect(result.rows).toHaveLength(2);
    expect(result.duplicatesSkipped).toBe(1);

    expect(result.rows[0].category).toBe("Guitars");
    expect(result.rows[0].productType).toBe("Dreadnought");
    expect(result.rows[1].category).toBe("Keyboards");
  });

  it("handles empty sheets with appropriate error", () => {
    const ws = XLSX.utils.aoa_to_sheet([]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Empty");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    expect(() => parseTaxonomyBuffer(buffer)).toThrow(/no data rows/i);
  });

  it("accurately parses and deduplicates Vibe_Music_Catalog_Master.xlsx", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(process.cwd(), "Vibe_Music_Catalog_Master.xlsx");

    if (!fs.existsSync(filePath)) return;

    const buffer = fs.readFileSync(filePath);
    const result = parseTaxonomyBuffer(buffer);

    expect(result.totalRowsRead).toBe(41200);
    expect(result.rows).toHaveLength(2800);
    expect(result.duplicatesSkipped).toBe(38400);

    // Verify first row mapping
    const first = result.rows[0];
    expect(first.category).toBe("Guitars");
    expect(first.subcategory).toBe("Acoustic");
    expect(first.productType).toBe("Dreadnought");
    expect(first.seoSlug).toBe("guitars-acoustic-dreadnought-beginner");
  });
});
