"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { generateCdnSrcSet, storefrontImageCandidates } from "@/lib/storefrontImages";

type HomepageProductImageProps = {
  src: string;
  /** Self-hosted art used when CDN derivatives fail (local dev / missing CDN files). */
  fallbackSrc?: string;
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

const DECORATIVE_MAX_WAIT_MS = 400;

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
 * Plain <img> + srcSet so thumb-proxy redirects and CDN fallbacks swap reliably.
 */
export default function HomepageProductImage({
  src,
  fallbackSrc,
  className,
  sizes = "(max-width: 767px) 46vw, 280px",
  fill = false,
  width = 480,
  height = 480,
  priority = false,
  decorative = false,
}: HomepageProductImageProps) {
  const [useSrcSet, setUseSrcSet] = useState(true);
  const srcSet = useSrcSet ? generateCdnSrcSet(src, "card") : undefined;

  const candidates = useMemo(() => {
    const extras = fallbackSrc ? [fallbackSrc] : [];
    return storefrontImageCandidates(src, width, extras);
  }, [src, fallbackSrc, width]);

  const [attempt, setAttempt] = useState(0);
  const loadedRef = useRef(false);

  const activeSrc = candidates[Math.min(attempt, candidates.length - 1)] ?? src;

  const [canRenderClone, setCanRenderClone] = useState(() => {
    if (typeof window === "undefined" || decorative) return false;
    return true;
  });

  const advanceCandidate = () => {
    loadedRef.current = false;
    setAttempt((current) => (current < candidates.length - 1 ? current + 1 : current));
  };

  useEffect(() => {
    setAttempt(0);
    setUseSrcSet(true);
    loadedRef.current = false;
  }, [src, fallbackSrc, width]);

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
    const timer = window.setTimeout(() => {
      setCanRenderClone(true);
    }, DECORATIVE_MAX_WAIT_MS);

    return () => {
      window.removeEventListener("vibe:img-ready", onReady);
      window.clearTimeout(timer);
    };
  }, [decorative, activeSrc]);

  if (!src || attempt >= candidates.length || (decorative && !canRenderClone)) {
    return <div aria-hidden className={placeholderClass(className)} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={activeSrc}
      alt=""
      className={className}
      decoding="async"
      fetchPriority={decorative ? "low" : priority ? "high" : "auto"}
      height={fill ? undefined : height}
      loading={decorative ? "lazy" : priority ? "eager" : "lazy"}
      sizes={srcSet ? sizes : undefined}
      src={activeSrc}
      srcSet={srcSet}
      width={fill ? undefined : width}
      onError={() => {
        if (useSrcSet && srcSet) {
          setUseSrcSet(false);
          return;
        }
        advanceCandidate();
      }}
      onLoad={() => {
        loadedRef.current = true;
        if (!decorative) {
          markSourceLoaded(activeSrc);
        }
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
