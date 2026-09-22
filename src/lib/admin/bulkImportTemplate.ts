/**
 * Canonical Vibe Music product bulk-import template (public assets + labels + API).
 * Column parsing lives in `amazonListingImport.ts` — headers must match
 * `public/vibemusic bulk.csv` / `public/vibemusic bulk.xlsx` exactly.
 */
export {
  VIBEMUSIC_BULK_HEADERS,
  VIBEMUSIC_BULK_COLUMN_COUNT,
  VIBEMUSIC_BULK_SIGNATURE_HEADERS,
  type VibemusicBulkHeader,
  buildVibemusicBulkTemplateCsv,
  buildVibemusicBulkTemplateXlsx,
  catalogProductToBulkRow,
  detectProductImportFormat,
  failedImportRowsToBulkCsv,
  findSkuImagesInZip,
  isSpreadsheetUpload,
  parseListingPrice,
  parseProductImportBuffer,
  validateVibemusicBulkHeaders,
  vibemusicBulkRowToImportRow,
  type ParsedProductImport,
  type ProductImportFormat,
} from "@/lib/amazonListingImport";
export { MAX_IMPORT_ROWS } from "@/lib/admin/bulkImportValidation";

export const VIBEMUSIC_BULK_TEMPLATE_CSV_FILE = "vibemusic bulk.csv";
export const VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE = "vibemusic bulk.xlsx";

/** URL-encoded paths for static files in /public (filenames contain a space). */
export const VIBEMUSIC_BULK_TEMPLATE_CSV_URL = "/vibemusic%20bulk.csv";
export const VIBEMUSIC_BULK_TEMPLATE_XLSX_URL = "/vibemusic%20bulk.xlsx";

export const VIBEMUSIC_BULK_EXPORT_FILENAME_PREFIX = "vibemusic-bulk-export";
export const VIBEMUSIC_BULK_FAILED_ROWS_FILENAME = "vibemusic-bulk-import-failed-rows.csv";

export const VIBEMUSIC_BULK_IMPORT_TITLE = "Vibe Music Bulk Import";
export const VIBEMUSIC_BULK_IMPORT_SHORT_LABEL = "Import products";

export const VIBEMUSIC_BULK_REQUIRED_COLUMNS =
  "Brand, SKU, MODEL NO., ITEM TITLE, Category, MRP, Selling Price (+ 62 more columns in exact template order)";

export function vibemusicBulkExportFilename(ext = "csv"): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${VIBEMUSIC_BULK_EXPORT_FILENAME_PREFIX}-${stamp}.${ext}`;
}
