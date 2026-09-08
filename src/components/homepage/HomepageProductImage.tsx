"use client";

import { useEffect, useMemo, useState } from "react";
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
   * wait until the visible sequence loads the same asset into memory cache.
   */
  decorative?: boolean;
};

function placeholderClass(className?: string) {
  return `${className ?? ""} homepage-product-image--placeholder`.trim();
}

/** Global registry of image assets loaded by the primary sequence in this session. */
const loadedSources = new Set<string>();

function markSourceLoaded(src: string) {
  if (!src || loadedSources.has(src)) return;
  loadedSources.add(src);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vibe:img-ready", { detail: src }));
  }
}

/**
 * Product images for homepage carousels/grids.
 * Prefer sized thumbs; if thumb fails (timeout/404), fall back to the CDN source.
 */
export default function HomepageProductImage({
  src,
  className,
  sizes,
  fill = false,
  width = 480,
  height = 480,
  priority = false,
  decorative = false,
}: HomepageProductImageProps) {
  // The thumb endpoint can be temporarily unavailable during a cache miss or
  // upstream CDN slowdown. Keep the original CDN URL as an immediate fallback
  // so a failed derivative never leaves a homepage product tile blank.
  const candidates = useMemo(() => storefrontImageCandidates(src, width), [src, width]);
  const [attempt, setAttempt] = useState(0);
  const activeSrc = candidates[Math.min(attempt, candidates.length - 1)] ?? src;

  const [canRenderClone, setCanRenderClone] = useState(() => {
    if (typeof window === "undefined" || decorative) return false;
    return true;
  });

  useEffect(() => {
    if (!decorative) return;
    if (loadedSources.has(activeSrc)) {
      setCanRenderClone(true);
      return;
    }

    const onReady = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail === activeSrc) {
        setCanRenderClone(true);
      }
    };

    window.addEventListener("vibe:img-ready", onReady);
    // Defer clone rendering until primary sequence has time to fetch,
    // ensuring the clone pulls from browser cache without initiating network load.
    const timer = window.setTimeout(() => {
      setCanRenderClone(true);
    }, 2500);

    return () => {
      window.removeEventListener("vibe:img-ready", onReady);
      window.clearTimeout(timer);
    };
  }, [decorative, activeSrc]);

  if (!src || attempt >= candidates.length || (decorative && !canRenderClone)) {
    return <div aria-hidden className={placeholderClass(className)} />;
  }

  return (
    <ProductImage
      key={activeSrc}
      alt=""
      className={className}
      decoding="async"
      fetchPriority={decorative ? "low" : priority ? "high" : "auto"}
      fill={fill}
      height={height}
      loading={decorative ? "lazy" : priority ? "eager" : "lazy"}
      sizes={sizes}
      src={activeSrc}
      variant="card"
      width={width}
      onError={() => setAttempt((current) => current + 1)}
      onLoad={() => {
        if (!decorative) {
          markSourceLoaded(activeSrc);
        }
      }}
    />
  );
}
