import {
  buildMediaTransformUrl,
  MEDIA_PRESETS,
  type MediaTransformOptions,
} from "@/lib/media-url";

export function optimizeImageUrl(
  url: string,
  preset: keyof typeof MEDIA_PRESETS = "productCard"
): string {
  if (!url) return url;
  return buildMediaTransformUrl(url, MEDIA_PRESETS[preset]);
}

export function optimizeImage(
  url: string,
  options: MediaTransformOptions
): string {
  if (!url) return url;
  return buildMediaTransformUrl(url, options);
}
