import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import {
  findSkuImagesInZip,
  isBulkImportZipImageEntry,
  lookupZipImageRef,
  readBulkImportZipImageIndex,
  readBulkImportZipImageMap,
} from "@/lib/admin/bulkImportZipImages";

describe("bulkImportZipImages", () => {
  it("accepts SKU-suffixed files without a visible extension", () => {
    expect(isBulkImportZipImageEntry("VM-BOSS-GX100_7")).toBe(true);
    expect(isBulkImportZipImageEntry("readme.txt")).toBe(false);
  });

  it("reads seven SKU-matched files from a flat ZIP", () => {
    const zip = new AdmZip();
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    for (let index = 1; index <= 7; index += 1) {
      zip.addFile(`VM-BOSS-GX100_${index}.jpg`, jpeg);
    }

    const map = readBulkImportZipImageMap(zip.toBuffer());
    expect(map.size).toBe(7);
    expect(map.has("vm-boss-gx100_7.jpg")).toBe(true);
  });

  it("indexes images inside SKU-named folders", () => {
    const zip = new AdmZip();
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    zip.addFile("VM-001/front.jpg", jpeg);
    zip.addFile("VM-001/back.jpg", jpeg);
    zip.addFile("products/VM-002/1.jpg", jpeg);
    zip.addFile("products/VM-002/2.jpg", jpeg);

    const index = readBulkImportZipImageIndex(zip.toBuffer());
    expect(index.entries).toHaveLength(4);

    const vm001 = findSkuImagesInZip(index, "VM-001");
    expect(vm001).toHaveLength(2);
    expect(vm001.map((entry) => entry.filename)).toEqual(["vm-001/back.jpg", "vm-001/front.jpg"]);

    const vm002 = findSkuImagesInZip(index, "VM-002");
    expect(vm002).toHaveLength(2);
    expect(vm002[0]?.filename).toBe("products/vm-002/1.jpg");

    expect(lookupZipImageRef(index, "products/VM-002/2.jpg")?.relativePath).toBe(
      "products/vm-002/2.jpg",
    );
  });
});
