import {
  buildMediaTransformUrl,
  MEDIA_PRESETS,
  type MediaTransformOptions,
} from "@/lib/media-url";

const CDN_HOST = "cdn.vibemusic.in";
const DERIVATIVE_WIDTHS = [240, 480, 960, 1600] as const;

function snapDerivativeWidth(width: number): (typeof DERIVATIVE_WIDTHS)[number] {
  const next = DERIVATIVE_WIDTHS.find((w) => w >= width);
  if (next) return next;
  return DERIVATIVE_WIDTHS[DERIVATIVE_WIDTHS.length - 1]!;
}

/**
 * Prefer CDN upload-time derivatives (`{uuid}-w480.webp`) when the URL already
 * points at a sized asset. Does **not** invent missing `-wN` files for legacy masters.
 */
export function cdnDerivativeUrl(url: string, width = 400): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== CDN_HOST) return null;
    const file = parsed.pathname.split("/").pop() ?? "";
    const match = file.match(
      /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-w(\d+)\.webp$/i
    );
    if (!match?.[1] || !match[2]) return null;
    const existingW = Number(match[2]);
    if (Number.isFinite(existingW) && existingW >= width * 0.85) {
      return url;
    }
    const snapped = snapDerivativeWidth(width);
    if (snapped === existingW) return url;
    const dir = parsed.pathname.slice(0, parsed.pathname.lastIndexOf("/") + 1);
    return `${parsed.origin}${dir}${match[1]}-w${snapped}.webp`;
  } catch {
    return null;
  }
}

/**
 * Storefront display URL:
 * - Known CDN derivatives (`-wN.webp`) → CDN (optionally bump width)
 * - Legacy CDN masters → `/api/media/thumb` (never invent missing derivatives)
 * - Other hosts → as-is (Cloudinary transforms applied upstream)
 */
export function storefrontImageUrl(
  url: string,
  width = 400
): { src: string; kind: "derivative" | "thumb" | "direct" } {
  if (!url) return { src: url, kind: "direct" };
  try {
    const host = new URL(url).hostname;
    if (host === CDN_HOST) {
      const derivative = cdnDerivativeUrl(url, width);
      if (derivative) {
        return { src: derivative, kind: "derivative" };
      }
      const params = new URLSearchParams({
        url,
        w: String(Math.min(800, Math.max(48, Math.floor(width)))),
      });
      return {
        src: `/api/media/thumb?${params.toString()}`,
        kind: "thumb",
      };
    }
  } catch {
    /* fall through */
  }
  return { src: url, kind: "direct" };
}

/** Resize CDN masters via derivative rewrite or local Sharp proxy. */
export function cdnThumbUrl(url: string, width = 400): string {
  return storefrontImageUrl(url, width).src;
}

export function optimizeImageUrl(
  url: string,
  preset: keyof typeof MEDIA_PRESETS = "productCard"
): string {
  if (!url) return url;
  const options = MEDIA_PRESETS[preset];
  const transformed = buildMediaTransformUrl(url, options);
  return storefrontImageUrl(transformed, options.width ?? 400).src;
}

export function optimizeImage(
  url: string,
  options: MediaTransformOptions
): string {
  if (!url) return url;
  const transformed = buildMediaTransformUrl(url, options);
  return storefrontImageUrl(transformed, options.width ?? 400).src;
}
