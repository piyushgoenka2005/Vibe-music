import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import {
  isBulkImportZipImageEntry,
  readBulkImportZipImageMap,
} from "@/lib/admin/bulkImportZipImages";

describe("bulkImportZipImages", () => {
  it("accepts SKU-suffixed files without a visible extension", () => {
    expect(isBulkImportZipImageEntry("VM-BOSS-GX100_7")).toBe(true);
    expect(isBulkImportZipImageEntry("readme.txt")).toBe(false);
  });

  it("reads seven SKU-matched files from a ZIP", () => {
    const zip = new AdmZip();
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    for (let index = 1; index <= 7; index += 1) {
      zip.addFile(`VM-BOSS-GX100_${index}.jpg`, jpeg);
    }

    const map = readBulkImportZipImageMap(zip.toBuffer());
    expect(map.size).toBe(7);
    expect(map.has("vm-boss-gx100_7.jpg")).toBe(true);
  });
});
