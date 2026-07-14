"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { storefrontImageUrl } from "@/lib/storefrontImages";

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
  sizes = "(max-width: 767px) 46vw, 320px",
  fill = false,
  width = 480,
  height = 480,
  priority = false,
  decorative = false,
}: HomepageProductImageProps) {
  const preferred = useMemo(
    () => storefrontImageUrl(src, width),
    [src, width]
  );
  const candidates = useMemo(() => {
    const list = [preferred.src, src].filter(
      (value): value is string => Boolean(value?.trim())
    );
    return Array.from(new Set(list));
  }, [preferred.src, src]);
  const [attempt, setAttempt] = useState(0);
  const activeSrc = candidates[Math.min(attempt, candidates.length - 1)] ?? src;

  if (!src || decorative || attempt >= candidates.length) {
    return <div aria-hidden className={placeholderClass(className)} />;
  }

  const onError = () => setAttempt((current) => current + 1);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={activeSrc}
      alt=""
      className={className}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      src={activeSrc}
      width={fill ? undefined : width}
      onError={onError}
      style={
        fill
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }
          : undefined
      }
    />
  );
}
