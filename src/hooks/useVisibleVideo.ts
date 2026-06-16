"use client";

import { useEffect, type RefObject } from "react";

interface UseVisibleVideoOptions {
  /** When true, video stays paused regardless of visibility */
  forcePaused?: boolean;
  /** Intersection ratio required before autoplay (0–1) */
  threshold?: number;
}

/**
 * Autoplay muted reel videos only while visible in the horizontal strip.
 */
export function useVisibleVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  { forcePaused = false, threshold = 0.55 }: UseVisibleVideoOptions = {}
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (forcePaused) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoRef.current) return;

        if (entry?.isIntersecting) {
          void videoRef.current.play().catch(() => {
            /* Autoplay may be blocked until user gesture */
          });
        } else {
          videoRef.current.pause();
        }
      },
      { threshold }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [videoRef, forcePaused, threshold]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (forcePaused) {
      video.pause();
    }
  }, [forcePaused, videoRef]);
}
