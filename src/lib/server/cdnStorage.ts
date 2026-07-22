import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * VPS CDN storage. Files are written to CDN_STORAGE_ROOT (nginx static root)
 * and served from CDN_PUBLIC_BASE_URL. Mirrors the Cloudinary folder layout so
 * existing consumers keep working with plain URL strings.
 */

const DEFAULT_STORAGE_ROOT = "/var/www/cdn";
const DEFAULT_PUBLIC_BASE_URL = "https://cdn.vibemusic.in";

/** Must stay in sync with CDN_DERIVATIVE_WIDTHS in cdnImageOptimize.ts */
const OPTIMIZED_DERIVATIVE_WIDTHS = [240, 480, 960, 1600] as const;

/** Folder prefixes this module is allowed to write to or delete from. */
const ALLOWED_PREFIXES = ["products/", "banners/", "blog/", "reviews/"];

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
};

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".svg",
]);

/** `{uuid}.webp` or `{uuid}-w960.webp` from uploadOptimizedImageToCdn. */
const OPTIMIZED_CDN_FILE_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-w\d+)?\.(webp|jpg|jpeg|png)$/i;

export function getCdnStorageRoot(): string {
  return process.env.CDN_STORAGE_ROOT?.trim() || DEFAULT_STORAGE_ROOT;
}

export function getCdnPublicBaseUrl(): string {
  const base =
    process.env.CDN_PUBLIC_BASE_URL?.trim() || DEFAULT_PUBLIC_BASE_URL;
  return base.replace(/\/+$/, "");
}

/** Public bases we may see on stored URLs (env + production default). */
function getKnownCdnPublicBases(): string[] {
  return Array.from(
    new Set([getCdnPublicBaseUrl(), DEFAULT_PUBLIC_BASE_URL.replace(/\/+$/, "")])
  );
}

function sanitizeSegment(value: string, fallback: string): string {
  const safe = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || fallback;
}

function assertAllowedFolder(folder: string): void {
  if (!ALLOWED_PREFIXES.some((prefix) => `${folder}/`.startsWith(prefix))) {
    throw new Error(`CDN upload folder not allowed: ${folder}`);
  }
}

function resolveExtension(filename: string, contentType?: string): string {
  const fromName = path.extname(filename).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(fromName)) return fromName === ".jpeg" ? ".jpg" : fromName;
  if (contentType && EXTENSION_BY_MIME[contentType]) {
    return EXTENSION_BY_MIME[contentType];
  }
  return ".jpg";
}

export interface CdnUploadOptions {
  /** Relative folder under the CDN root, e.g. "products/guitars/my-product". */
  folder: string;
  /** MIME type used to derive the extension when the filename has none. */
  contentType?: string;
}

/**
 * Writes a buffer to the CDN storage root under a UUID filename and returns
 * the public URL, e.g. https://cdn.vibemusic.in/products/guitars/slug/uuid.jpg
 */
export async function uploadBufferToCdn(
  buffer: Buffer,
  filename: string,
  options: CdnUploadOptions
): Promise<string> {
  const folder = options.folder.replace(/^\/+|\/+$/g, "");
  assertAllowedFolder(folder);

  const extension = resolveExtension(filename, options.contentType);
  const storedName = `${randomUUID()}${extension}`;

  const root = getCdnStorageRoot();
  const directory = path.resolve(root, folder);

  // Guard against path traversal via crafted folder values.
  if (!directory.startsWith(path.resolve(root) + path.sep)) {
    throw new Error(`CDN upload folder escapes storage root: ${folder}`);
  }

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storedName), buffer);

  return `${getCdnPublicBaseUrl()}/${folder}/${storedName}`;
}

export function isCdnUrl(url: string): boolean {
  return getKnownCdnPublicBases().some((base) => url.startsWith(`${base}/`));
}

function relativePathFromCdnUrl(url: string): string | null {
  for (const base of getKnownCdnPublicBases()) {
    const prefix = `${base}/`;
    if (!url.startsWith(prefix)) continue;
    return decodeURIComponent(url.slice(prefix.length)).replace(/^\/+/, "");
  }
  return null;
}

/**
 * When deleting an optimized upload asset, also remove master + sibling
 * derivatives so `-w960` deletes don't orphan `{uuid}.webp` / `-w240` etc.
 */
function relatedOptimizedRelativePaths(relativePath: string): string[] {
  const normalized = relativePath.replace(/\\/g, "/");
  const slash = normalized.lastIndexOf("/");
  const dir = slash >= 0 ? normalized.slice(0, slash) : "";
  const file = slash >= 0 ? normalized.slice(slash + 1) : normalized;
  const match = file.match(OPTIMIZED_CDN_FILE_RE);
  if (!match?.[1]) return [normalized];

  const id = match[1];
  const prefix = dir ? `${dir}/` : "";
  const related = new Set<string>([normalized, `${prefix}${id}.webp`]);
  for (const width of OPTIMIZED_DERIVATIVE_WIDTHS) {
    related.add(`${prefix}${id}-w${width}.webp`);
  }
  return Array.from(related);
}

async function unlinkRelativeCdnPath(relativePath: string): Promise<boolean> {
  if (!ALLOWED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
    return false;
  }

  const root = getCdnStorageRoot();
  const resolvedRoot = path.resolve(root);
  const filePath = path.resolve(root, relativePath);
  if (
    filePath !== resolvedRoot &&
    !filePath.startsWith(resolvedRoot + path.sep)
  ) {
    return false;
  }

  try {
    await unlink(filePath);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    // Already gone counts as deleted, matching Cloudinary "not found" behavior.
    return code === "ENOENT";
  }
}

/**
 * Deletes a file previously uploaded via CDN helpers, identified by its
 * public URL. For optimized WebP sets, removes master + all `-wN` siblings.
 * Returns false for URLs outside the CDN or outside allowed folders.
 */
export async function deleteImageFromCdn(url: string): Promise<boolean> {
  const relativePath = relativePathFromCdnUrl(url);
  if (!relativePath) return false;

  const targets = relatedOptimizedRelativePaths(relativePath);
  const results = await Promise.all(
    targets.map((target) => unlinkRelativeCdnPath(target))
  );
  // Success if the requested file (or any related optimized asset) was removed.
  return results.some(Boolean);
}

export function productUploadFolder(
  categorySlug: string,
  productSlug?: string
): string {
  const category = sanitizeSegment(categorySlug, "general");
  const product = sanitizeSegment(productSlug ?? "", "general");
  return `products/${category}/${product}`;
}

export function bannerUploadFolder(): string {
  return "banners/homepage";
}

export function blogUploadFolder(): string {
  return "blog/covers";
}

export function reviewUploadFolder(productId: string): string {
  const safe = productId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return `reviews/${safe || "general"}`;
}
