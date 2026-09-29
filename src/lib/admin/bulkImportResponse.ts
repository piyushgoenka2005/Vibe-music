import type { BulkImportPreviewRow } from "@/types/catalog";
import {
  bulkImportImagePreviewFilenames,
  countBulkImportImages,
  getMaxBulkImportImages,
} from "@/lib/admin/bulkImportImages";

/** Max rows rendered in the admin preview table (full counts stay in summary). */
export const BULK_IMPORT_PREVIEW_TABLE_LIMIT = 250;

/** Strip heavy fields before sending large previews to the browser. */
export function slimBulkImportPreviewRow(row: BulkImportPreviewRow): BulkImportPreviewRow {
  const imageCount = countBulkImportImages(row);
  const zipImageMatchPreview = bulkImportImagePreviewFilenames(row).slice(
    0,
    getMaxBulkImportImages(),
  );

  return {
    rowNumber: row.rowNumber,
    name: row.name,
    brand: row.brand,
    category: row.category,
    subcategory: row.subcategory,
    price: row.price,
    originalPrice: row.originalPrice,
    sku: row.sku,
    generatedSku: row.generatedSku,
    valid: row.valid,
    action: row.action,
    errors: row.errors,
    warnings: row.warnings,
    sourceFormat: row.sourceFormat,
    priceFromMrpFallback: row.priceFromMrpFallback,
    existingProductId: row.existingProductId,
    resolvedCategorySlug: row.resolvedCategorySlug,
    generatedSlug: row.generatedSlug,
    imageCount,
    zipImageMatchPreview: zipImageMatchPreview.length > 0 ? zipImageMatchPreview : undefined,
    zipImageMatches: undefined,
    resolvedImages: undefined,
  };
}

export function slimBulkImportPreviewRows(rows: BulkImportPreviewRow[]): BulkImportPreviewRow[] {
  return rows.map(slimBulkImportPreviewRow);
}
