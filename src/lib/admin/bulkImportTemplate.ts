/**
 * Canonical Vibe Music product bulk-import template (labels + download API).
 * Column spec lives in `amazonListingImport.ts` — 69 core headers + optional image1–image12.
 * Templates are generated on demand; do not duplicate static copies in /public.
 */
export {
  VIBEMUSIC_BULK_HEADERS,
  VIBEMUSIC_BULK_CORE_HEADERS,
  VIBEMUSIC_BULK_IMAGE_HEADERS,
  VIBEMUSIC_BULK_COLUMN_COUNT,
  VIBEMUSIC_BULK_CORE_COLUMN_COUNT,
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
export {
  DEFAULT_MAX_BULK_IMPORT_IMAGES,
  MAX_BULK_IMPORT_IMAGE_FIELDS,
} from "@/lib/admin/bulkImportImages";

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
  "Brand, SKU, MODEL NO., ITEM TITLE, Category, MRP, Selling Price (+ core spec columns)";

/** Primary subtitle under the modal title (keep in sync with upload-step hints). */
export function buildBulkImportIntroCopy(
  maxProducts = 2000,
  coreColumns = 69,
  fullColumns = 81,
  maxImages = 12,
): string {
  return `Upload products using the official vibemusic bulk spreadsheet — up to ${maxProducts.toLocaleString()} products per upload. Download the ${fullColumns}-column template (${coreColumns} core fields + image1–image${maxImages}), or re-import older ${coreColumns}-column sheets. Up to ${maxImages} images per SKU from the sheet columns or an optional images ZIP.`;
}

export function buildBulkImportTemplateHintCopy(
  coreColumns = 69,
  maxImages = 12,
  maxProducts = 2000,
): string {
  return `${coreColumns} core columns + image1–image${maxImages} in the downloadable template · up to ${maxImages} images per SKU · up to ${maxProducts.toLocaleString()} products per file`;
}

export function buildBulkImportZipHintCopy(maxZipMb = 100, maxImages = 12): string {
  return `Flat files (SKU.jpg, SKU_1.jpg …), SKU folders (SKU/photo.jpg), or paths in image1–image${maxImages}. All images inside a folder named after the SKU are imported. Max ${maxZipMb} MB.`;
}

export function buildBulkImportSheetHintCopy(
  maxSheetMb = 25,
  maxProducts = 2000,
  coreColumns = 69,
  fullColumns = 81,
): string {
  return `Drag & drop .xlsx / .csv here, or browse. Accepts ${coreColumns}-column legacy sheets or the full ${fullColumns}-column template · up to ${maxProducts.toLocaleString()} rows · max ${maxSheetMb} MB.`;
}

export function vibemusicBulkExportFilename(ext = "csv"): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${VIBEMUSIC_BULK_EXPORT_FILENAME_PREFIX}-${stamp}.${ext}`;
}
