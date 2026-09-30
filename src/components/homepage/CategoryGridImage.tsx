"use client";

import { useState } from "react";
import { getCategoryGridImage, getCategoryGridImageFallback } from "@/lib/categoryImages";

type CategoryGridImageProps = {
  slug: string;
  imageSrc: string;
  className?: string;
  width?: number;
  height?: number;
};

/**
 * Homepage category tile image — prefers small WebP thumbs, falls back to PNG/JPG
 * without going through the Next.js optimizer (more reliable on nginx/CDN edge).
 */
export default function CategoryGridImage({
  slug,
  imageSrc,
  className,
  width = 120,
  height = 120,
}: CategoryGridImageProps) {
  const primary = imageSrc || getCategoryGridImage(slug);
  const fallback = getCategoryGridImageFallback(slug);
  const [src, setSrc] = useState(primary);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={className}
      decoding="async"
      height={height}
      loading="lazy"
      src={src}
      width={width}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
