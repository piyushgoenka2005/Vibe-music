import "server-only";

import { collectBulkImportImageNames, getMaxBulkImportImages } from "@/lib/admin/bulkImportImages";
import {
  createEmptyBulkImportZipImageIndex,
  findSkuImagesInZip,
  lookupZipImageRef,
  type BulkImportZipImageIndex,
} from "@/lib/admin/bulkImportZipImages";
import { productUploadFolder } from "@/lib/server/cdnStorage";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";
import {
  ADMIN_IMAGE_MAX_BYTES,
  validateImageUploadBuffer,
} from "@/lib/security/imageUploadValidation";
import { buildProductSlug, slugify } from "@/lib/slug";
import type { BulkImportRow } from "@/types/catalog";

export const BULK_IMPORT_IMAGE_CONCURRENCY = 8;

export { collectBulkImportImageNames } from "@/lib/admin/bulkImportImages";
export type { BulkImportZipImageIndex } from "@/lib/admin/bulkImportZipImages";

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

function totalResolvedCount(resolvedImages: string[], zipImageMatches: string[]): number {
  return resolvedImages.length + zipImageMatches.length;
}

function atImageLimit(resolvedImages: string[], zipImageMatches: string[]): boolean {
  return totalResolvedCount(resolvedImages, zipImageMatches) >= getMaxBulkImportImages();
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]!, index);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function resolveBulkImportCategorySlug(row: BulkImportRow): string {
  if (row.resolvedCategorySlug?.trim()) return row.resolvedCategorySlug.trim();
  return slugify(row.category);
}

function resolveBulkImportProductSlug(row: BulkImportRow): string {
  if (row.generatedSlug?.trim()) return row.generatedSlug.trim();
  if (row.brand?.trim() && row.name?.trim()) return buildProductSlug(row.brand, row.name);
  return slugify(row.name);
}

function resolveBulkImportSku(row: BulkImportRow): string {
  return row.sku?.trim() || row.generatedSku?.trim() || "";
}

function isValidBulkImportImageBuffer(buffer: Buffer): boolean {
  return validateImageUploadBuffer(buffer, { maxBytes: ADMIN_IMAGE_MAX_BYTES }).ok;
}

async function uploadZipImage(
  buffer: Buffer,
  row: BulkImportRow,
  filenameHint: string,
): Promise<string | null> {
  if (!isValidBulkImportImageBuffer(buffer)) {
    return null;
  }

  const uploaded = await uploadOptimizedImageToCdn(buffer, {
    folder: productUploadFolder(
      resolveBulkImportCategorySlug(row),
      resolveBulkImportProductSlug(row),
    ),
    filenameHint,
  });
  return uploaded.url;
}

/**
 * Resolve listing images from URLs and/or a ZIP index.
 * Preview mode only checks ZIP matches — no CDN uploads.
 */
export async function resolveBulkImportRowImages(
  row: BulkImportRow,
  zipIndex: BulkImportZipImageIndex,
  upload: boolean,
): Promise<BulkImportRow> {
  const imageNames = collectBulkImportImageNames(row);
  const resolvedImages: string[] = [];
  const zipImageMatches: string[] = [];
  const usedZipKeys = new Set<string>();

  for (const ref of imageNames) {
    if (atImageLimit(resolvedImages, zipImageMatches)) break;

    if (isUrl(ref)) {
      resolvedImages.push(ref);
      continue;
    }

    const zipEntry = lookupZipImageRef(zipIndex, ref);
    if (!zipEntry) continue;

    const dedupeKey = zipEntry.relativePath;
    if (usedZipKeys.has(dedupeKey)) continue;

    usedZipKeys.add(dedupeKey);
    if (upload) {
      const uploadedUrl = await uploadZipImage(zipEntry.buffer, row, ref);
      if (uploadedUrl) resolvedImages.push(uploadedUrl);
    } else {
      zipImageMatches.push(zipEntry.relativePath);
    }
  }

  const sku = resolveBulkImportSku(row);
  if (zipIndex.entries.length > 0 && sku) {
    const skuMatches = findSkuImagesInZip(zipIndex, sku);
    for (const match of skuMatches) {
      if (atImageLimit(resolvedImages, zipImageMatches)) break;

      const dedupeKey = match.filename.toLowerCase();
      if (usedZipKeys.has(dedupeKey)) continue;

      usedZipKeys.add(dedupeKey);
      if (upload) {
        const uploadedUrl = await uploadZipImage(match.buffer, row, match.filename);
        if (uploadedUrl) resolvedImages.push(uploadedUrl);
      } else {
        zipImageMatches.push(match.filename);
      }
    }
  }

  return {
    ...row,
    resolvedImages: resolvedImages.length > 0 ? resolvedImages : undefined,
    zipImageMatches: zipImageMatches.length > 0 ? zipImageMatches : undefined,
  };
}

export async function resolveBulkImportImages(
  rows: BulkImportRow[],
  zipIndex: BulkImportZipImageIndex,
  upload: boolean,
): Promise<BulkImportRow[]> {
  if (
    zipIndex.entries.length === 0 &&
    !rows.some((row) => collectBulkImportImageNames(row).some(isUrl))
  ) {
    return rows;
  }

  if (upload) {
    return mapWithConcurrency(
      rows,
      (row) => resolveBulkImportRowImages(row, zipIndex, true),
      BULK_IMPORT_IMAGE_CONCURRENCY,
    );
  }

  return Promise.all(rows.map((row) => resolveBulkImportRowImages(row, zipIndex, false)));
}

export { createEmptyBulkImportZipImageIndex };
