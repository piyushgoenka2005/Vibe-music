"use client";

import { useMemo, useState } from "react";
import { storefrontImageCandidates } from "@/lib/storefrontImages";

interface StorefrontThumbImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  /** Fill positioned parent (PDP cross-sell / card media wells). */
  fill?: boolean;
  /**
   * Prefer the CDN/original URL first (useful when many thumbs load at once
   * and the thumb API can rate-limit or time out).
   */
  preferOriginal?: boolean;
}

/**
 * Product thumbs via CDN derivatives or `/api/media/thumb`, with CDN fallback.
 * Uses plain <img> so 404/timeout thumbs swap to the master URL immediately.
 */
export default function StorefrontThumbImage({
  src,
  alt = "",
  className,
  width = 72,
  height = 72,
  fill = false,
  preferOriginal = false,
}: StorefrontThumbImageProps) {
  const candidates = useMemo(() => {
    const list = storefrontImageCandidates(src, Math.max(width, height));
    if (!preferOriginal || list.length < 2) return list;
    const [preferred, ...rest] = list;
    const original = rest[rest.length - 1] ?? preferred;
    return Array.from(new Set([original, preferred, ...rest].filter(Boolean)));
  }, [src, width, height, preferOriginal]);

  const [attempt, setAttempt] = useState(0);
  const [srcKey, setSrcKey] = useState(src);
  if (src !== srcKey) {
    setSrcKey(src);
    setAttempt(0);
  }

  const safeAttempt = src === srcKey ? attempt : 0;
  const displaySrc =
    candidates[Math.min(safeAttempt, candidates.length - 1)] ?? "";

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
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      decoding="async"
      loading="lazy"
      onError={() => setAttempt((current) => current + 1)}
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
