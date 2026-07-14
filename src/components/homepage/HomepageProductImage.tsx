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
};

/**
 * Product images for homepage carousels/grids.
 * Prefer CDN derivatives, then `/api/media/thumb`. Never fall back to multi‑MB masters.
 */
export default function HomepageProductImage({
  src,
  className,
  sizes = "(max-width: 767px) 46vw, 280px",
  fill = false,
  width = 320,
  height = 320,
  priority = false,
}: HomepageProductImageProps) {
  const primary = useMemo(
    () => storefrontImageUrl(src, width),
    [src, width]
  );
  const thumbApiSrc = useMemo(() => {
    try {
      if (new URL(src).hostname !== "cdn.vibemusic.in") return null;
      const params = new URLSearchParams({
        url: src,
        w: String(Math.min(800, width)),
      });
      return `/api/media/thumb?${params.toString()}`;
    } catch {
      return null;
    }
  }, [src, width]);

  const [mode, setMode] = useState<"primary" | "thumb" | "failed">("primary");

  const activeSrc =
    mode === "thumb" && thumbApiSrc
      ? thumbApiSrc
      : mode === "failed"
        ? ""
        : primary.src;

  const usePlainImg = activeSrc.startsWith("/api/media/thumb");

  if (!src || mode === "failed" || !activeSrc) {
    return (
      <div
        aria-hidden
        className={`${className ?? ""} homepage-product-image--placeholder`.trim()}
      />
    );
  }

  const onError = () => {
    setMode((current) => {
      if (current === "primary" && thumbApiSrc && primary.src !== thumbApiSrc) {
        return "thumb";
      }
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
