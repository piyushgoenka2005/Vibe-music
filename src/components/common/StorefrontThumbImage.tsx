"use client";

import Image from "next/image";
import { useMemo } from "react";
import { storefrontImageUrl } from "@/lib/storefrontImages";

interface StorefrontThumbImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Small product thumbs. Always routes CDN masters through derivatives / thumb API
 * so cart, checkout, and drawers never download multi‑MB originals.
 */
export default function StorefrontThumbImage({
  src,
  alt = "",
  className,
  width = 72,
  height = 72,
}: StorefrontThumbImageProps) {
  const displaySrc = useMemo(
    () => storefrontImageUrl(src, Math.max(width, height)).src,
    [src, width, height]
  );

  const unoptimized =
    displaySrc.startsWith("http://") ||
    displaySrc.startsWith("https://") ||
    displaySrc.includes("/api/media/thumb");

  if (!displaySrc) return null;

  return (
    <Image
      src={displaySrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={unoptimized}
    />
  );
}
