import "server-only";

import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { getCdnPublicBaseUrl, getCdnStorageRoot } from "@/lib/server/cdnStorage";
import { logWarn } from "@/lib/server/logger";
import { sniffImageType } from "@/lib/security/imageUploadValidation";

type SharpFactory = typeof import("sharp").default;

let sharpLoader: Promise<SharpFactory | null> | null = null;

/**
 * sharp's prebuilt linux-x64 binary needs an x86-64-v2 CPU (SSE4.2/POPCNT); some VPS
 * hypervisors expose a generic QEMU CPU without it, so the native module fails to load.
 */
export function loadSharp(): Promise<SharpFactory | null> {
  sharpLoader ??= import("sharp").then(
    (mod) => mod.default,
    (error: unknown) => {
      logWarn(
        `sharp unavailable — storing original images without WebP derivatives: ${
          error instanceof Error ? error.message.split("\n")[0] : String(error)
        }`,
        "cdn-image-optimize",
      );
      return null;
    },
  );
  return sharpLoader;
}

const ORIGINAL_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Longest edge for the master WebP written to CDN. */
export const CDN_MASTER_MAX_EDGE = 2000;

/** Card / mosaic / PDP / banner widths generated at upload. */
export const CDN_DERIVATIVE_WIDTHS = [240, 320, 480, 800, 960, 1600] as const;

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
  options: { folder: string; filenameHint?: string },
): Promise<OptimizedCdnUploadResult> {
  const folder = options.folder.replace(/^\/+|\/+$/g, "");
  assertAllowedFolder(folder);

  const root = getCdnStorageRoot();
  const directory = path.resolve(root, folder);
  if (!directory.startsWith(path.resolve(root) + path.sep)) {
    throw new Error(`CDN upload folder escapes storage root: ${folder}`);
  }

  const sharp = await loadSharp();
  const id = randomUUID();
  await mkdir(directory, { recursive: true });
  const publicBase = getCdnPublicBaseUrl();

  if (!sharp) {
    const mime = sniffImageType(buffer);
    if (!mime) throw new Error("Unsupported image type");
    const originalName = `${id}.${ORIGINAL_EXTENSION[mime]}`;
    await writeFile(path.join(directory, originalName), buffer);
    const originalUrl = `${publicBase}/${folder}/${originalName}`;
    return { url: originalUrl, masterUrl: originalUrl, derivatives: {} };
  }

  const masterBody = await sharp(buffer)
    .rotate()
    .resize(CDN_MASTER_MAX_EDGE, CDN_MASTER_MAX_EDGE, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 92, effort: 5 })
    .toBuffer();

  const masterName = `${id}.webp`;
  await writeFile(path.join(directory, masterName), masterBody);
  const masterUrl = `${publicBase}/${folder}/${masterName}`;

  const derivatives: Partial<Record<CdnDerivativeWidth, string>> = {};
  await Promise.all(
    CDN_DERIVATIVE_WIDTHS.map(async (width) => {
      const body = await sharp(masterBody)
        .resize(width, width, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 92, effort: 5 })
        .toBuffer();
      const name = `${id}-w${width}.webp`;
      await writeFile(path.join(directory, name), body);
      derivatives[width] = `${publicBase}/${folder}/${name}`;
    }),
  );

  return {
    url: derivatives[960] ?? derivatives[480] ?? masterUrl,
    masterUrl,
    derivatives,
  };
}
