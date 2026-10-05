"use client";

import { useState, type CSSProperties } from "react";

import { generateCdnSrcSet } from "@/lib/storefrontImages";

export { generateCdnSrcSet };

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
  onLoad?: () => void;
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
  onLoad,
}: ProductImageProps) {
  const [useSrcSet, setUseSrcSet] = useState(true);
  const srcSet = useSrcSet ? generateCdnSrcSet(src, variant) : undefined;

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
      onError={() => {
        if (useSrcSet && srcSet) {
          setUseSrcSet(false);
          return;
        }
        onError?.();
      }}
      onLoad={onLoad}
      style={productImageInlineStyle({ fill, variant })}
    />
  );
}
