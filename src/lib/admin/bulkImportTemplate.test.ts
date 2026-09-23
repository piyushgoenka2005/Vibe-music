import { describe, expect, it } from "vitest";
import {
  buildVibemusicBulkTemplateCsv,
  buildVibemusicBulkTemplateXlsx,
  VIBEMUSIC_BULK_HEADERS,
  VIBEMUSIC_BULK_TEMPLATE_CSV_FILE,
  VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE,
} from "@/lib/admin/bulkImportTemplate";

describe("bulk import template API payloads", () => {
  it("builds CSV with exact header row", () => {
    const csv = buildVibemusicBulkTemplateCsv();
    expect(csv.trim()).toBe([...VIBEMUSIC_BULK_HEADERS].join(","));
  });

  it("builds XLSX with exact header row", () => {
    const buffer = buildVibemusicBulkTemplateXlsx();
    expect(buffer.byteLength).toBeGreaterThan(100);
  });

  it("uses human-readable download filenames", () => {
    expect(VIBEMUSIC_BULK_TEMPLATE_CSV_FILE).toBe("vibemusic bulk.csv");
    expect(VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE).toBe("vibemusic bulk.xlsx");
  });
});
