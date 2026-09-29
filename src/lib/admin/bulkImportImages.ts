import type { BulkImportRow } from "@/types/catalog";

/** Spreadsheet columns for explicit image filenames or URLs (image1–image12). */
export const BULK_IMPORT_IMAGE_FIELDS = [
  "image1",
  "image2",
  "image3",
  "image4",
  "image5",
  "image6",
  "image7",
  "image8",
  "image9",
  "image10",
  "image11",
  "image12",
] as const;

export type BulkImportImageField = (typeof BULK_IMPORT_IMAGE_FIELDS)[number];

export const DEFAULT_MAX_BULK_IMPORT_IMAGES = 12;
export const MAX_BULK_IMPORT_IMAGE_FIELDS = BULK_IMPORT_IMAGE_FIELDS.length;

export function getMaxBulkImportImages(
  env: Record<string, string | undefined> = process.env,
): number {
  const raw = env.MAX_BULK_IMPORT_IMAGES;
  if (!raw?.trim()) return DEFAULT_MAX_BULK_IMPORT_IMAGES;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_MAX_BULK_IMPORT_IMAGES;
  return Math.min(parsed, MAX_BULK_IMPORT_IMAGE_FIELDS);
}

export function collectBulkImportImageNames(row: BulkImportRow): string[] {
  const names: string[] = [];
  for (const field of BULK_IMPORT_IMAGE_FIELDS) {
    const value = row[field]?.trim();
    if (value) names.push(value);
  }
  return names;
}

export function assignBulkImportImageFields(
  target: Record<string, string>,
  images: string[],
): void {
  for (let index = 0; index < BULK_IMPORT_IMAGE_FIELDS.length; index += 1) {
    target[BULK_IMPORT_IMAGE_FIELDS[index]!] = images[index] ?? "";
  }
}

export function countBulkImportImages(row: {
  resolvedImages?: string[];
  zipImageMatches?: string[];
}): number {
  return (row.resolvedImages?.length ?? 0) + (row.zipImageMatches?.length ?? 0);
}

export function bulkImportImagePreviewFilenames(row: { zipImageMatches?: string[] }): string[] {
  return row.zipImageMatches ?? [];
}

export function formatBulkImportImageSummary(row: {
  resolvedImages?: string[];
  zipImageMatches?: string[];
}): string {
  const count = countBulkImportImages(row);
  if (count === 0) return "—";

  const filenames = bulkImportImagePreviewFilenames(row);
  if (filenames.length > 0) {
    const preview = filenames.slice(0, 4).join(", ");
    return filenames.length > 4 ? `${count} (${preview}…)` : `${count} (${preview})`;
  }

  if (row.resolvedImages?.length) {
    return `${row.resolvedImages.length} uploaded URL(s)`;
  }

  return String(count);
}

export function formatBulkImportPreviewImageSummary(row: {
  imageCount?: number;
  zipImageMatchPreview?: string[];
}): string {
  const count = row.imageCount ?? 0;
  if (count === 0) return "—";
  const preview = row.zipImageMatchPreview ?? [];
  if (preview.length === 0) return String(count);
  const label = preview.slice(0, 4).join(", ");
  return preview.length >= count ? `${count}: ${label}` : `${count}: ${label}…`;
}
