import AdmZip from "adm-zip";

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|bmp|tif?f)$/i;

/** SKU-style image names without an extension (e.g. VM-BOSS-GX100_7). */
const SKU_SUFFIX_PATTERN = /^[a-z0-9][a-z0-9._-]*[_-]\d+$/i;

function zipEntryBasename(entryName: string): string {
  return entryName.split("/").pop()?.trim() ?? entryName.trim();
}

export function isBulkImportZipImageEntry(entryName: string): boolean {
  const base = zipEntryBasename(entryName);
  if (!base || base.startsWith(".") || base.startsWith("__MACOSX")) return false;
  if (IMAGE_EXTENSION.test(base)) return true;
  const stem = base.replace(/\.[^.]+$/, "");
  return SKU_SUFFIX_PATTERN.test(stem);
}

/** Extract image files from a bulk-import ZIP into a lowercase filename map. */
export function readBulkImportZipImageMap(zipBuffer: Buffer): Map<string, Buffer> {
  const zipMap = new Map<string, Buffer>();
  const zip = new AdmZip(zipBuffer);

  zip.getEntries().forEach((entry) => {
    if (entry.isDirectory) return;
    if (!isBulkImportZipImageEntry(entry.entryName)) return;
    const name = zipEntryBasename(entry.entryName).toLowerCase();
    zipMap.set(name, entry.getData());
  });

  return zipMap;
}
