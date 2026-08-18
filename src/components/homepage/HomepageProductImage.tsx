"use client";

import { useMemo, useState } from "react";
import ProductImage from "@/components/common/ProductImage";
import { storefrontImageCandidates } from "@/lib/storefrontImages";

type HomepageProductImageProps = {
  src: string;
  className?: string;
  sizes?: string;
  /** Use fill (parent must be positioned). */
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  /**
   * Decorative clone (e.g. marquee duplicate). Skip network completely —
   * the visible sequence already loads the same assets.
   */
  decorative?: boolean;
};

function placeholderClass(className?: string) {
  return `${className ?? ""} homepage-product-image--placeholder`.trim();
}

/**
 * Product images for homepage carousels/grids.
 * Prefer sized thumbs; if thumb fails (timeout/404), fall back to the CDN source.
 */
export default function HomepageProductImage({
  src,
  className,
  fill = false,
  width = 480,
  height = 480,
  priority = false,
  decorative = false,
}: HomepageProductImageProps) {
  // The thumb endpoint can be temporarily unavailable during a cache miss or
  // upstream CDN slowdown. Keep the original CDN URL as an immediate fallback
  // so a failed derivative never leaves a homepage product tile blank.
  const candidates = useMemo(
    () => storefrontImageCandidates(src, width),
    [src, width]
  );
  const [attempt, setAttempt] = useState(0);
  const activeSrc = candidates[Math.min(attempt, candidates.length - 1)] ?? src;

  if (!src || decorative || attempt >= candidates.length) {
    return <div aria-hidden className={placeholderClass(className)} />;
  }

  return (
    <ProductImage
      key={activeSrc}
      alt=""
      className={className}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      fill={fill}
      height={height}
      loading={priority ? "eager" : "lazy"}
      src={activeSrc}
      variant="card"
      width={width}
      onError={() => setAttempt((current) => current + 1)}
    />
  );
}
