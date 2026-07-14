import "server-only";

import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import {
  getCdnPublicBaseUrl,
  getCdnStorageRoot,
} from "@/lib/server/cdnStorage";

/** Longest edge for the master WebP written to CDN. */
export const CDN_MASTER_MAX_EDGE = 2000;

/** Card / mosaic / PDP / banner widths generated at upload. */
export const CDN_DERIVATIVE_WIDTHS = [240, 480, 960, 1600] as const;

export type CdnDerivativeWidth = (typeof CDN_DERIVATIVE_WIDTHS)[number];

const ALLOWED_PREFIXES = ["products/", "banners/", "blog/", "reviews/"];

function assertAllowedFolder(folder: string): void {
  if (!ALLOWED_PREFIXES.some((prefix) => `${folder}/`.startsWith(prefix))) {
    throw new Error(`CDN upload folder not allowed: ${folder}`);
  }
}

export interface OptimizedCdnUploadResult {
  /** Default storefront/card URL (w960 WebP). */
  url: string;
  masterUrl: string;
  derivatives: Partial<Record<CdnDerivativeWidth, string>>;
}

/**
 * Optimize a product/banner/blog buffer and write master + WebP derivatives to CDN storage.
 * Returns the **w960** URL as `url` so the catalog stores a high-quality asset by default.
 */
export async function uploadOptimizedImageToCdn(
  buffer: Buffer,
  options: { folder: string; filenameHint?: string }
): Promise<OptimizedCdnUploadResult> {
  const folder = options.folder.replace(/^\/+|\/+$/g, "");
  assertAllowedFolder(folder);

  const root = getCdnStorageRoot();
  const directory = path.resolve(root, folder);
  if (!directory.startsWith(path.resolve(root) + path.sep)) {
    throw new Error(`CDN upload folder escapes storage root: ${folder}`);
  }

  const sharp = (await import("sharp")).default;
  const id = randomUUID();
  await mkdir(directory, { recursive: true });

  const masterBody = await sharp(buffer)
    .rotate()
    .resize(CDN_MASTER_MAX_EDGE, CDN_MASTER_MAX_EDGE, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  const masterName = `${id}.webp`;
  await writeFile(path.join(directory, masterName), masterBody);
  const publicBase = getCdnPublicBaseUrl();
  const masterUrl = `${publicBase}/${folder}/${masterName}`;

  const derivatives: Partial<Record<CdnDerivativeWidth, string>> = {};
  for (const width of CDN_DERIVATIVE_WIDTHS) {
    const body = await sharp(masterBody)
      .resize(width, width, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    const name = `${id}-w${width}.webp`;
    await writeFile(path.join(directory, name), body);
    derivatives[width] = `${publicBase}/${folder}/${name}`;
  }

  return {
    url: derivatives[960] ?? derivatives[480] ?? masterUrl,
    masterUrl,
    derivatives,
  };
}
