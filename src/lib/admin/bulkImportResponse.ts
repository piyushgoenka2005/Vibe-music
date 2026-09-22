import type { BulkImportPreviewRow } from "@/types/catalog";

/** Max rows rendered in the admin preview table (full counts stay in summary). */
export const BULK_IMPORT_PREVIEW_TABLE_LIMIT = 250;

/** Strip heavy fields before sending large previews to the browser. */
export function slimBulkImportPreviewRow(row: BulkImportPreviewRow): BulkImportPreviewRow {
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
    zipImageMatches: row.zipImageMatches?.length
      ? [`${row.zipImageMatches.length} ZIP match(es)`]
      : undefined,
    resolvedImages: row.resolvedImages?.length
      ? [`${row.resolvedImages.length} image(s)`]
      : undefined,
  };
}

export function slimBulkImportPreviewRows(rows: BulkImportPreviewRow[]): BulkImportPreviewRow[] {
  return rows.map(slimBulkImportPreviewRow);
}
