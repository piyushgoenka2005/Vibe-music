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

export function getCdnStorageRoot(): string {
  return process.env.CDN_STORAGE_ROOT?.trim() || DEFAULT_STORAGE_ROOT;
}

export function getCdnPublicBaseUrl(): string {
  const base =
    process.env.CDN_PUBLIC_BASE_URL?.trim() || DEFAULT_PUBLIC_BASE_URL;
  return base.replace(/\/+$/, "");
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
  return url.startsWith(`${getCdnPublicBaseUrl()}/`);
}

/**
 * Deletes a file previously uploaded via uploadBufferToCdn, identified by its
 * public URL. Returns false for URLs outside the CDN or outside allowed folders.
 */
export async function deleteImageFromCdn(url: string): Promise<boolean> {
  const base = `${getCdnPublicBaseUrl()}/`;
  if (!url.startsWith(base)) return false;

  const relativePath = decodeURIComponent(url.slice(base.length)).replace(
    /^\/+/,
    ""
  );
  if (!ALLOWED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
    return false;
  }

  const root = getCdnStorageRoot();
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(path.resolve(root) + path.sep)) {
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
