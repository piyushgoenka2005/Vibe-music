import {
  buildMediaTransformUrl,
  MEDIA_PRESETS,
  type MediaTransformOptions,
} from "@/lib/media-url";

/** Resize CDN masters via local Sharp proxy so cards never pull multi‑MB PNGs. */
export function cdnThumbUrl(url: string, width = 400): string {
  try {
    const host = new URL(url).hostname;
    if (host === "cdn.vibemusic.in") {
      const params = new URLSearchParams({
        url,
        w: String(width),
      });
      return `/api/media/thumb?${params.toString()}`;
    }
  } catch {
    // fall through
  }
  return url;
}

export function optimizeImageUrl(
  url: string,
  preset: keyof typeof MEDIA_PRESETS = "productCard"
): string {
  if (!url) return url;
  const options = MEDIA_PRESETS[preset];
  const transformed = buildMediaTransformUrl(url, options);
  return cdnThumbUrl(transformed, options.width ?? 400);
}

export function optimizeImage(
  url: string,
  options: MediaTransformOptions
): string {
  if (!url) return url;
  const transformed = buildMediaTransformUrl(url, options);
  return cdnThumbUrl(transformed, options.width ?? 400);
}
