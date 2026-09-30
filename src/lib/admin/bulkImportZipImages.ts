import AdmZip from "adm-zip";

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|bmp|tif?f|avif)$/i;

/** SKU-style image names without an extension (e.g. VM-BOSS-GX100_7). */
const SKU_SUFFIX_PATTERN = /^[a-z0-9][a-z0-9._-]*[_-]\d+$/i;

export interface BulkImportZipImageEntry {
  /** Lowercase relative path using forward slashes, e.g. products/vm-001/front.jpg */
  relativePath: string;
  /** Lowercase basename, e.g. front.jpg */
  basename: string;
  /** Immediate parent folder name (lowercase), null when file is at ZIP root. */
  folderName: string | null;
  buffer: Buffer;
}

export interface BulkImportZipImageIndex {
  byBasename: Map<string, Buffer>;
  byRelativePath: Map<string, Buffer>;
  entries: BulkImportZipImageEntry[];
}

function zipEntryBasename(entryName: string): string {
  return entryName.split("/").pop()?.trim() ?? entryName.trim();
}

function normalizeZipRelativePath(entryName: string): string {
  return entryName
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .trim()
    .toLowerCase();
}

export function isBulkImportZipImageEntry(entryName: string): boolean {
  const base = zipEntryBasename(entryName);
  if (!base || base.startsWith(".") || base.startsWith("__MACOSX")) return false;
  if (IMAGE_EXTENSION.test(base)) return true;
  const stem = base.replace(/\.[^.]+$/, "");
  return SKU_SUFFIX_PATTERN.test(stem);
}

function parentFolderName(relativePath: string): string | null {
  const slash = relativePath.lastIndexOf("/");
  if (slash <= 0) return null;
  return relativePath.slice(0, slash).split("/").pop() ?? null;
}

/** Extract image files from a bulk-import ZIP with folder + path aware indexing. */
export function readBulkImportZipImageIndex(zipBuffer: Buffer): BulkImportZipImageIndex {
  const byBasename = new Map<string, Buffer>();
  const byRelativePath = new Map<string, Buffer>();
  const entries: BulkImportZipImageEntry[] = [];
  const zip = new AdmZip(zipBuffer);

  zip.getEntries().forEach((entry) => {
    if (entry.isDirectory) return;
    if (!isBulkImportZipImageEntry(entry.entryName)) return;

    const relativePath = normalizeZipRelativePath(entry.entryName);
    const basename = zipEntryBasename(relativePath).toLowerCase();
    const buffer = entry.getData();
    const record: BulkImportZipImageEntry = {
      relativePath,
      basename,
      folderName: parentFolderName(relativePath),
      buffer,
    };

    entries.push(record);
    byRelativePath.set(relativePath, buffer);
    byBasename.set(basename, buffer);
  });

  return { byBasename, byRelativePath, entries };
}

/** Backward-compatible flat map (basename + relative path keys). */
export function readBulkImportZipImageMap(zipBuffer: Buffer): Map<string, Buffer> {
  const index = readBulkImportZipImageIndex(zipBuffer);
  const map = new Map<string, Buffer>();
  for (const entry of index.entries) {
    map.set(entry.basename, entry.buffer);
    map.set(entry.relativePath, entry.buffer);
  }
  return map;
}

export function createEmptyBulkImportZipImageIndex(): BulkImportZipImageIndex {
  return { byBasename: new Map(), byRelativePath: new Map(), entries: [] };
}

function normalizeZipLookupRef(ref: string): string {
  return ref.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/").toLowerCase();
}

/** Resolve an image reference from spreadsheet columns against the ZIP index. */
export function lookupZipImageRef(
  index: BulkImportZipImageIndex,
  ref: string,
): BulkImportZipImageEntry | null {
  const normalized = normalizeZipLookupRef(ref);
  if (!normalized) return null;

  const direct = index.byRelativePath.get(normalized);
  if (direct) {
    return index.entries.find((entry) => entry.relativePath === normalized) ?? null;
  }

  const basename = zipEntryBasename(normalized).toLowerCase();
  const basenameBuffer = index.byBasename.get(basename);
  if (basenameBuffer) {
    return index.entries.find((entry) => entry.basename === basename) ?? null;
  }

  const suffixMatch = index.entries.find(
    (entry) =>
      entry.relativePath.endsWith(`/${normalized}`) ||
      entry.relativePath.endsWith(`\\${normalized}`),
  );
  return suffixMatch ?? null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function imageSortOrder(filename: string, sku: string): number {
  const base = (filename.split("/").pop() ?? filename).replace(/\.[^.]+$/, "").toLowerCase();
  const cleaned = sku.trim().toLowerCase();
  if (base === cleaned) return 0;
  const suffix = base.match(new RegExp(`^${escapeRegExp(cleaned)}[_-](\\d+)$`));
  if (suffix) return Number(suffix[1]);
  return 10_000;
}

function compareZipImageEntries(
  a: BulkImportZipImageEntry,
  b: BulkImportZipImageEntry,
  sku: string,
): number {
  const orderDiff = imageSortOrder(a.relativePath, sku) - imageSortOrder(b.relativePath, sku);
  if (orderDiff !== 0) return orderDiff;
  return a.relativePath.localeCompare(b.relativePath);
}

/**
 * Resolve product images from a ZIP using SKU naming conventions and SKU folders.
 * Matches flat files (SKU.jpg, SKU_1.jpg) and folder layouts (SKU/any-name.jpg, products/SKU/1.jpg).
 */
export function findSkuImagesInZip(
  index: BulkImportZipImageIndex,
  sku: string,
): Array<{ filename: string; buffer: Buffer }> {
  const cleaned = sku.trim().toLowerCase();
  if (!cleaned || index.entries.length === 0) return [];

  const matches = new Map<string, BulkImportZipImageEntry>();

  for (const entry of index.entries) {
    const base = entry.basename.replace(/\.[^.]+$/, "");
    if (base === cleaned) {
      matches.set(entry.relativePath, entry);
      continue;
    }

    const suffix = base.match(new RegExp(`^${escapeRegExp(cleaned)}[_-](\\d+)$`));
    if (suffix) {
      matches.set(entry.relativePath, entry);
      continue;
    }

    if (entry.folderName === cleaned) {
      matches.set(entry.relativePath, entry);
      continue;
    }

    const segments = entry.relativePath.split("/");
    if (segments.some((segment, index) => index < segments.length - 1 && segment === cleaned)) {
      matches.set(entry.relativePath, entry);
    }
  }

  return Array.from(matches.values())
    .sort((a, b) => compareZipImageEntries(a, b, cleaned))
    .map((entry) => ({ filename: entry.relativePath, buffer: entry.buffer }));
}
