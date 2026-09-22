import { z } from "zod";
import { DEFAULT_BULK_IMPORT_OPTIONS, type BulkImportOptions } from "@/lib/admin/bulkImportTypes";

export const bulkImportOptionsSchema = z.object({
  duplicateStrategy: z.enum(["fail", "skip", "update"]).default("fail"),
  publishStatus: z.enum(["active", "draft"]).default("active"),
});

export function parseBulkImportOptions(raw: FormDataEntryValue | null): BulkImportOptions {
  if (typeof raw !== "string" || !raw.trim()) {
    return DEFAULT_BULK_IMPORT_OPTIONS;
  }
  try {
    const parsed = bulkImportOptionsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_BULK_IMPORT_OPTIONS;
  } catch {
    return DEFAULT_BULK_IMPORT_OPTIONS;
  }
}

export const MAX_SHEET_BYTES = 25 * 1024 * 1024;
export const MAX_CSV_BYTES = MAX_SHEET_BYTES;
export const MAX_ZIP_BYTES = 100 * 1024 * 1024;
/** Maximum product rows per bulk upload (vibemusic bulk template). */
export const MAX_IMPORT_ROWS = 2000;
/** PostgreSQL upsert batch size during confirmed bulk import. */
export const BULK_IMPORT_WRITE_BATCH_SIZE = 50;

const MAX_SHEET_MB = Math.round(MAX_SHEET_BYTES / (1024 * 1024));
const MAX_ZIP_MB = Math.round(MAX_ZIP_BYTES / (1024 * 1024));

export function validateSpreadsheetFile(file: File): string | null {
  if (file.size <= 0) return "Listing file is empty.";
  if (file.size > MAX_SHEET_BYTES) {
    return `Listing file must be at most ${MAX_SHEET_MB} MB.`;
  }
  const name = file.name.toLowerCase();
  const looksSheet =
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv") ||
    file.type.includes("sheet") ||
    file.type.includes("excel") ||
    file.type.includes("csv");
  if (!looksSheet) {
    return "Upload the Vibe Music bulk template as .xlsx or .csv.";
  }
  return null;
}

/** @deprecated Prefer validateSpreadsheetFile — kept for callers still naming CSV. */
export function validateCsvFile(file: File): string | null {
  return validateSpreadsheetFile(file);
}

export function validateZipFile(file: File): string | null {
  if (file.size <= 0) return "ZIP file is empty.";
  if (file.size > MAX_ZIP_BYTES) {
    return `ZIP must be at most ${MAX_ZIP_MB} MB.`;
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".zip") && !file.type.includes("zip")) {
    return "Upload a .zip file for images.";
  }
  return null;
}
