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
 * Always route CDN masters through sized thumbs/derivatives — never the
 * multi‑MB PNG masters that stall Trending / Staff Picks / Best Sellers.
 */
export default function HomepageProductImage({
  src,
  className,
  sizes = "(max-width: 767px) 46vw, 280px",
  fill = false,
  width = 320,
  height = 320,
  priority = false,
  decorative = false,
}: HomepageProductImageProps) {
  const preferred = useMemo(
    () => storefrontImageUrl(src, width),
    [src, width]
  );
  const [failed, setFailed] = useState(false);

  if (!src || decorative || failed) {
    return <div aria-hidden className={placeholderClass(className)} />;
  }

  const activeSrc = preferred.src;
  const onError = () => setFailed(true);

  const usePlainImg =
    activeSrc.startsWith("/api/media/thumb") ||
    activeSrc.startsWith("https://cdn.vibemusic.in/");

  if (usePlainImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        className={className}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        height={height}
        loading={priority ? "eager" : "lazy"}
        src={activeSrc}
        width={width}
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

  if (fill) {
    return (
      <Image
        alt=""
        className={className}
        fill
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        sizes={sizes}
        src={activeSrc}
        onError={onError}
      />
    );
  }

  return (
    <Image
      alt=""
      className={className}
      fetchPriority={priority ? "high" : undefined}
      height={height}
      loading={priority ? "eager" : "lazy"}
      priority={priority}
      sizes={sizes}
      src={activeSrc}
      width={width}
      onError={onError}
    />
  );
}
