import type { CSSProperties } from "react";

import { cdnMasterUrl } from "@/lib/storefrontImages";

export type ProductImageVariant = "card" | "pdp" | "thumb";

export type ProductImageProps = {
  src: string;
  alt?: string;
  className?: string;
  variant?: ProductImageVariant;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "auto" | "low";
  decoding?: "async" | "sync" | "auto";
  draggable?: boolean;
  onError?: () => void;
};

/** Shared inline styles — never apply resting transform scale here. */
function productImageInlineStyle(options: {
  fill?: boolean;
  variant?: ProductImageVariant;
}): CSSProperties | undefined {
  if (!options.fill) return undefined;
  return {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center",
    boxSizing: "border-box",
    padding:
      options.variant === "thumb"
        ? 0
        : "var(--product-image-well-padding, clamp(0.5rem, 1.2vw, 0.75rem))",
  };
}

/** Shared thumb buckets from storefrontImages. */
const THUMB_WIDTHS = [320, 480, 800, 960, 1600] as const;

export function generateCdnSrcSet(src: string): string | undefined {
  if (!src) return undefined;
  if (!src.includes("cdn.vibemusic.in") || !src.endsWith(".webp")) return undefined;
  
  const master = cdnMasterUrl(src);
  // master is something like https://cdn.vibemusic.in/.../uuid.webp
  const parsed = new URL(master);
  const file = parsed.pathname.split("/").pop() ?? "";
  const match = file.match(/^(.+)\.([a-z0-9]+)$/i);
  if (!match || match[2].toLowerCase() !== "webp") return undefined;

  const dir = parsed.pathname.slice(0, parsed.pathname.lastIndexOf("/") + 1);
  const name = match[1];
  
  return THUMB_WIDTHS.map((w) => `${parsed.origin}${dir}${name}-w${w}.webp ${w}w`).join(", ");
}

/**
 * Consistent product image element for cards, PDP, and thumbs.
 * Resting zoom is forbidden — use CSS hover tokens on wrappers only.
 */
export default function ProductImage({
  src,
  alt = "",
  className,
  variant = "card",
  fill = false,
  width,
  height,
  sizes,
  loading = "lazy",
  fetchPriority = "auto",
  decoding = "async",
  draggable,
  onError,
}: ProductImageProps) {
  const srcSet = generateCdnSrcSet(src);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      decoding={decoding}
      draggable={draggable}
      fetchPriority={fetchPriority}
      height={fill ? undefined : height}
      loading={loading}
      sizes={sizes}
      src={src}
      srcSet={srcSet}
      width={fill ? undefined : width}
      onError={onError}
      style={productImageInlineStyle({ fill, variant })}
    />
  );
}
