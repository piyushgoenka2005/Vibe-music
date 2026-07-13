"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cdnThumbUrl } from "@/lib/images";

type HomepageProductImageProps = {
  src: string;
  className?: string;
  sizes?: string;
  /** Use fill (parent must be positioned). */
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
};

/**
 * Product images for homepage carousels/grids.
 * Large CDN masters are served via `/api/media/thumb` so cards don't hang on
 * multi‑MB PNGs. Local / Cloudinary URLs use next/image for AVIF/WebP.
 */
export default function HomepageProductImage({
  src,
  className,
  sizes = "(max-width: 767px) 46vw, 280px",
  fill = false,
  width = 400,
  height = 400,
  priority = false,
}: HomepageProductImageProps) {
  const thumbSrc = useMemo(() => cdnThumbUrl(src, width), [src, width]);
  const [mode, setMode] = useState<"thumb" | "original" | "failed">(
    thumbSrc === src ? "original" : "thumb"
  );

  const activeSrc = mode === "thumb" ? thumbSrc : src;
  const usePlainImg = activeSrc.startsWith("/api/media/thumb");

  if (!src || mode === "failed") {
    return (
      <div
        aria-hidden
        className={`${className ?? ""} homepage-product-image--placeholder`.trim()}
      />
    );
  }

  const onError = () => {
    setMode((current) => {
      if (current === "thumb" && thumbSrc !== src) return "original";
      return "failed";
    });
  };

  if (usePlainImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        className={className}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        src={activeSrc}
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
