import { describe, expect, it } from "vitest";
import {
  buildBulkImportIntroCopy,
  buildBulkImportTemplateHintCopy,
  buildBulkImportZipHintCopy,
  VIBEMUSIC_BULK_COLUMN_COUNT,
  VIBEMUSIC_BULK_CORE_COLUMN_COUNT,
} from "@/lib/admin/bulkImportTemplate";

describe("bulk import copy", () => {
  it("describes the 81-column template and 12-image ZIP workflow", () => {
    const intro = buildBulkImportIntroCopy(
      2000,
      VIBEMUSIC_BULK_CORE_COLUMN_COUNT,
      VIBEMUSIC_BULK_COLUMN_COUNT,
      12,
    );
    expect(intro).toMatch(/81-column template/i);
    expect(intro).toMatch(/image1–image12/i);
    expect(intro).toMatch(/12 images per SKU/i);

    const templateHint = buildBulkImportTemplateHintCopy(
      VIBEMUSIC_BULK_CORE_COLUMN_COUNT,
      12,
      2000,
    );
    expect(templateHint).toMatch(/image1–image12/i);

    const zipHint = buildBulkImportZipHintCopy(100, 12);
    expect(zipHint).toMatch(/SKU folders/i);
    expect(zipHint).toMatch(/SKU_1\.jpg/i);
    expect(zipHint).toMatch(/image1–image12/i);
  });
});
