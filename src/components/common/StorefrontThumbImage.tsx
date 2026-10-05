"use client";

import { useMemo, useState } from "react";
import { generateCdnSrcSet, storefrontImageCandidates } from "@/lib/storefrontImages";

interface StorefrontThumbImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  /** Self-hosted art when CDN/thumb candidates fail. */
  fallbackSrc?: string;
  /** Fill positioned parent (PDP cross-sell / card media wells). */
  fill?: boolean;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "auto" | "low";
}

/**
 * Product thumbs via CDN derivatives or `/api/media/thumb`, with CDN fallback.
 * Uses plain <img> + srcSet so the browser picks the smallest sufficient bucket.
 */
export default function StorefrontThumbImage({
  src,
  alt = "",
  className,
  width = 72,
  height = 72,
  sizes = "(max-width: 767px) 46vw, 280px",
  fallbackSrc,
  fill = false,
  loading = "lazy",
  fetchPriority = "auto",
}: StorefrontThumbImageProps) {
  const displayWidth = Math.max(width, height);
  const [useSrcSet, setUseSrcSet] = useState(true);
  const srcSet = useSrcSet ? generateCdnSrcSet(src, "card") : undefined;

  const candidates = useMemo(() => {
    const extras = fallbackSrc ? [fallbackSrc] : [];
    return storefrontImageCandidates(src, displayWidth, extras);
  }, [src, displayWidth, fallbackSrc]);

  const [attempt, setAttempt] = useState(0);
  const [srcKey, setSrcKey] = useState(src);
  if (src !== srcKey) {
    setSrcKey(src);
    setAttempt(0);
    setUseSrcSet(true);
  }

  const safeAttempt = src === srcKey ? attempt : 0;
  const displaySrc = candidates[Math.min(safeAttempt, candidates.length - 1)] ?? "";

  if (!displaySrc || safeAttempt >= candidates.length) {
    return (
      <div
        aria-hidden
        className={`${className ?? ""} storefront-thumb-image--placeholder`.trim()}
        style={fill ? undefined : { width, height }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={displaySrc}
      src={displaySrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      decoding="async"
      fetchPriority={fetchPriority}
      loading={loading}
      onError={() => {
        if (useSrcSet && srcSet) {
          setUseSrcSet(false);
          return;
        }
        setAttempt((current) => current + 1);
      }}
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
