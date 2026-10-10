import "server-only";

import path from "node:path";
import { logWarn } from "@/lib/server/logger";
import { uploadBufferToCdn } from "@/lib/server/platform/cdnStorage";

/** Free public image hosts admins paste links from; copies live on our CDN instead. */
const MIRRORED_IMAGE_HOSTS = ["postimage.me", "postimg.cc"];

const MAX_MIRROR_BYTES = 15 * 1024 * 1024;
const MIRROR_FETCH_TIMEOUT_MS = 15_000;
const MIRRORABLE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export function isMirrorableExternalImageUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname.toLowerCase();
    return MIRRORED_IMAGE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

/**
 * Copy a postimg/postimage image onto the VPS CDN and return the CDN URL.
 * Returns the original URL unchanged when it is not mirrorable or the copy fails,
 * so admin content is never dropped.
 */
export async function mirrorExternalImageToCdn(url: string, folder: string): Promise<string> {
  const trimmed = url.trim();
  if (!isMirrorableExternalImageUrl(trimmed)) return url;

  try {
    const response = await fetch(trimmed, {
      redirect: "error",
      signal: AbortSignal.timeout(MIRROR_FETCH_TIMEOUT_MS),
      headers: { Accept: "image/*", "User-Agent": "VibeMusicCdnMirror/1.0" },
    });
    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!response.ok || !MIRRORABLE_CONTENT_TYPES.has(contentType)) {
      logWarn("External image not mirrored", "cdn-mirror", {
        url: trimmed,
        status: response.status,
        contentType,
      });
      return url;
    }

    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_MIRROR_BYTES) return url;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_MIRROR_BYTES) return url;

    const filename = path.posix.basename(new URL(trimmed).pathname) || "image";
    return await uploadBufferToCdn(buffer, filename, { folder, contentType });
  } catch (error) {
    logWarn("External image mirror failed", "cdn-mirror", {
      url: trimmed,
      error: error instanceof Error ? error.message : String(error),
    });
    return url;
  }
}

export async function mirrorOptionalExternalImage<T extends string | null | undefined>(
  url: T,
  folder: string,
): Promise<T | string> {
  if (!url) return url;
  return mirrorExternalImageToCdn(url, folder);
}

/** Mirror a product's primary image and gallery, sharing one copy per distinct URL. */
export async function mirrorProductImageFields<T extends { image?: string; images?: string[] }>(
  input: T,
  folder: string,
): Promise<T> {
  const urls = [input.image, ...(input.images ?? [])].filter(isMirrorableExternalImageUrl);
  if (urls.length === 0) return input;

  const mirrored = new Map<string, string>();
  for (const url of new Set(urls as string[])) {
    mirrored.set(url, await mirrorExternalImageToCdn(url, folder));
  }
  const swap = (url: string) => mirrored.get(url) ?? url;
  return {
    ...input,
    ...(input.image !== undefined ? { image: swap(input.image) } : {}),
    ...(input.images !== undefined ? { images: input.images.map(swap) } : {}),
  };
}
