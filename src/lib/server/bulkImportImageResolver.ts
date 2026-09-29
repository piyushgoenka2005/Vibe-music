import "server-only";

import { collectBulkImportImageNames, getMaxBulkImportImages } from "@/lib/admin/bulkImportImages";
import { findSkuImagesInZip } from "@/lib/amazonListingImport";
import { productUploadFolder } from "@/lib/server/cdnStorage";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";
import { buildProductSlug, slugify } from "@/lib/slug";
import type { BulkImportRow } from "@/types/catalog";

export const BULK_IMPORT_IMAGE_CONCURRENCY = 8;

export { collectBulkImportImageNames } from "@/lib/admin/bulkImportImages";

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

async function uploadZipImage(
  buffer: Buffer,
  row: BulkImportRow,
  filenameHint: string,
): Promise<string> {
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
 * Resolve listing images from URLs and/or a ZIP map.
 * Preview mode only checks ZIP matches — no CDN uploads.
 */
export async function resolveBulkImportRowImages(
  row: BulkImportRow,
  zipMap: Map<string, Buffer>,
  upload: boolean,
): Promise<BulkImportRow> {
  const imageNames = collectBulkImportImageNames(row);
  const resolvedImages: string[] = [];
  const zipImageMatches: string[] = [];
  const usedZipFilenames = new Set<string>();

  for (const ref of imageNames) {
    if (atImageLimit(resolvedImages, zipImageMatches)) break;

    if (isUrl(ref)) {
      resolvedImages.push(ref);
      continue;
    }

    const normalizedRef = ref.toLowerCase();
    if (usedZipFilenames.has(normalizedRef)) continue;

    const bufferFromZip = zipMap.get(normalizedRef);
    if (!bufferFromZip) continue;

    usedZipFilenames.add(normalizedRef);
    if (upload) {
      resolvedImages.push(await uploadZipImage(bufferFromZip, row, ref));
    } else {
      zipImageMatches.push(ref);
    }
  }

  if (zipMap.size > 0 && row.sku?.trim()) {
    const skuMatches = findSkuImagesInZip(zipMap, row.sku);
    for (const match of skuMatches) {
      if (atImageLimit(resolvedImages, zipImageMatches)) break;

      const normalizedFilename = match.filename.toLowerCase();
      if (usedZipFilenames.has(normalizedFilename)) continue;

      usedZipFilenames.add(normalizedFilename);
      if (upload) {
        resolvedImages.push(await uploadZipImage(match.buffer, row, match.filename));
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
  zipMap: Map<string, Buffer>,
  upload: boolean,
): Promise<BulkImportRow[]> {
  if (zipMap.size === 0 && !rows.some((row) => collectBulkImportImageNames(row).some(isUrl))) {
    return rows;
  }

  if (upload) {
    return mapWithConcurrency(
      rows,
      (row) => resolveBulkImportRowImages(row, zipMap, true),
      BULK_IMPORT_IMAGE_CONCURRENCY,
    );
  }

  return Promise.all(rows.map((row) => resolveBulkImportRowImages(row, zipMap, false)));
}
