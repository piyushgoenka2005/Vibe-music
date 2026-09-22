import type { BulkImportPreviewRow } from "@/types/catalog";
import type {
  BulkImportDuplicateStrategy,
  BulkImportPreviewSummary,
} from "@/lib/admin/bulkImportTypes";

function imageCount(row: BulkImportPreviewRow): number {
  return (row.resolvedImages?.length ?? 0) + (row.zipImageMatches?.length ?? 0);
}

export function buildBulkImportPreviewSummary(
  preview: BulkImportPreviewRow[],
  emptyRowsSkipped = 0,
): BulkImportPreviewSummary {
  const categoryCounts = new Map<string, number>();
  const errorCounts = new Map<string, number>();

  let creates = 0;
  let updates = 0;
  let skips = 0;
  let withImages = 0;
  let withoutImages = 0;
  let valid = 0;
  let invalid = 0;

  for (const row of preview) {
    if (row.valid) valid += 1;
    else invalid += 1;

    if (row.action === "update") updates += 1;
    else if (row.action === "skip") skips += 1;
    else if (row.valid) creates += 1;

    const category = row.category?.trim();
    if (category) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    for (const error of row.errors) {
      errorCounts.set(error, (errorCounts.get(error) ?? 0) + 1);
    }

    const images = imageCount(row);
    if (images > 0) withImages += 1;
    else if (row.sourceFormat === "vibemusic-bulk") withoutImages += 1;
  }

  const categories = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const errorBreakdown = [...errorCounts.entries()]
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    total: preview.length,
    valid,
    invalid,
    creates,
    updates,
    skips,
    withImages,
    withoutImages,
    categories,
    errorBreakdown,
    emptyRowsSkipped,
  };
}

export function duplicateStrategyLabel(strategy: BulkImportDuplicateStrategy): string {
  switch (strategy) {
    case "fail":
      return "Reject duplicate SKUs";
    case "skip":
      return "Skip existing SKUs";
    case "update":
      return "Update existing SKUs";
  }
}
