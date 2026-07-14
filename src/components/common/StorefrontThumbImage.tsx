"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { storefrontImageUrl } from "@/lib/storefrontImages";

interface StorefrontThumbImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Small product thumbs via CDN derivatives or `/api/media/thumb`.
 * Never loads full multi‑MB PNG masters into the browser.
 */
export default function StorefrontThumbImage({
  src,
  alt = "",
  className,
  width = 72,
  height = 72,
}: StorefrontThumbImageProps) {
  const preferred = useMemo(
    () => storefrontImageUrl(src, Math.max(width, height)),
    [src, width, height]
  );
  const [failed, setFailed] = useState(false);

  const displaySrc = preferred.src;

  const unoptimized =
    displaySrc.startsWith("http://") ||
    displaySrc.startsWith("https://") ||
    displaySrc.includes("/api/media/thumb");

  if (!displaySrc || failed) {
    return (
      <div
        aria-hidden
        className={`${className ?? ""} storefront-thumb-image--placeholder`.trim()}
        style={{ width, height }}
      />
    );
  }

  return (
    <Image
      src={displaySrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={unoptimized}
      onError={() => {
        // Never fall back to full CDN masters (often multi‑MB PNGs).
        setFailed(true);
      }}
    />
  );
}
