import "server-only";

import { findSkuImagesInZip } from "@/lib/amazonListingImport";
import { productUploadFolder } from "@/lib/server/cdnStorage";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";
import type { BulkImportRow } from "@/types/catalog";

export const BULK_IMPORT_IMAGE_CONCURRENCY = 8;

function collectImageNames(row: BulkImportRow): string[] {
  return [row.image1, row.image2, row.image3, row.image4, row.image5].filter(
    (name): name is string => Boolean(name?.trim()),
  );
}

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
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

async function uploadZipImage(
  buffer: Buffer,
  row: BulkImportRow,
  filenameHint: string,
): Promise<string> {
  const categorySlug = row.category.toLowerCase().replace(/\s+/g, "-");
  const productSlug = row.name.toLowerCase().replace(/\s+/g, "-");
  const uploaded = await uploadOptimizedImageToCdn(buffer, {
    folder: productUploadFolder(categorySlug, productSlug),
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
  const imageNames = collectImageNames(row);
  const resolvedImages: string[] = [];
  const zipImageMatches: string[] = [];

  for (const ref of imageNames) {
    if (isUrl(ref)) {
      resolvedImages.push(ref);
      continue;
    }
    const bufferFromZip = zipMap.get(ref.toLowerCase());
    if (!bufferFromZip) continue;
    if (upload) {
      resolvedImages.push(await uploadZipImage(bufferFromZip, row, ref));
    } else {
      zipImageMatches.push(ref);
    }
  }

  if (zipMap.size > 0 && row.sku?.trim()) {
    const skuMatches = findSkuImagesInZip(zipMap, row.sku);
    for (const match of skuMatches.slice(0, 5)) {
      if (resolvedImages.length + zipImageMatches.length >= 5) break;
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
  if (zipMap.size === 0 && !rows.some((row) => collectImageNames(row).some(isUrl))) {
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
