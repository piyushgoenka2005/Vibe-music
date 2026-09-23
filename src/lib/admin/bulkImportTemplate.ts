/**
 * Canonical Vibe Music product bulk-import template (labels + download API).
 * Column spec lives in `amazonListingImport.ts` — 69 headers in fixed order.
 * Templates are generated on demand; do not duplicate static copies in /public.
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

/** Filename shown when admins download the template (Excel / CSV). */
export const VIBEMUSIC_BULK_TEMPLATE_CSV_FILE = "vibemusic bulk.csv";
export const VIBEMUSIC_BULK_TEMPLATE_XLSX_FILE = "vibemusic bulk.xlsx";

/** Admin-authenticated download endpoints (production-safe — no /public static files). */
export const VIBEMUSIC_BULK_TEMPLATE_API_PATH = "/api/admin/products/import/template";
export const VIBEMUSIC_BULK_TEMPLATE_CSV_URL = `${VIBEMUSIC_BULK_TEMPLATE_API_PATH}?format=csv`;
export const VIBEMUSIC_BULK_TEMPLATE_XLSX_URL = `${VIBEMUSIC_BULK_TEMPLATE_API_PATH}?format=xlsx`;

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
