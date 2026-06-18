"use client";

import { useEffect, useRef, type RefObject } from "react";

interface UseVisibleVideoOptions {
  /** When true, video stays paused regardless of visibility */
  forcePaused?: boolean;
  /** Fraction of card width that must be visible inside the strip (0–1) */
  visibilityRatio?: number;
  /** Horizontal scroll strip — visibility is measured against this element */
  scrollRootRef?: RefObject<HTMLElement | null>;
  /** Stagger initial play to avoid browser decoder limits */
  playDelayMs?: number;
}

interface UseContinuousVideoOptions {
  /** When true, video stays paused (e.g. modal open) */
  forcePaused?: boolean;
  /** Stagger initial play to avoid browser decoder limits */
  playDelayMs?: number;
}

function playMuted(video: HTMLVideoElement) {
  video.muted = true;
  video.playsInline = true;
  video.defaultMuted = true;
  video.loop = true;

  if (video.readyState === 0) {
    video.load();
  }

  void video.play().catch(() => {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      video.addEventListener(
        "loadeddata",
        () => {
          void video.play().catch(() => {});
        },
        { once: true }
      );
    }
  });
}

function getVisibleOverlap(
  container: HTMLElement,
  strip: HTMLElement | null
): { overlap: number; ratio: number } {
  const cardRect = container.getBoundingClientRect();
  if (cardRect.width <= 0) return { overlap: 0, ratio: 0 };

  const rootRect = strip?.getBoundingClientRect() ?? {
    left: 0,
    right: window.innerWidth,
  };

  const overlap =
    Math.min(cardRect.right, rootRect.right) -
    Math.max(cardRect.left, rootRect.left);

  return {
    overlap,
    ratio: overlap / cardRect.width,
  };
}

function isVisibleInStrip(
  container: HTMLElement,
  strip: HTMLElement | null,
  visibilityRatio: number
): boolean {
  const { overlap, ratio } = getVisibleOverlap(container, strip);
  return overlap > 1 && ratio >= visibilityRatio;
}

/**
 * Keeps a muted reel playing continuously — never pauses unless forcePaused.
 */
export function useContinuousVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  { forcePaused = false, playDelayMs = 0 }: UseContinuousVideoOptions = {}
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let retryTimer = 0;
    let startTimer = 0;

    const ensurePlaying = () => {
      if (cancelled || forcePaused || !videoRef.current) return;
      if (videoRef.current.paused) {
        playMuted(videoRef.current);
      }
    };

    const onPause = () => {
      if (!forcePaused && !cancelled) {
        window.requestAnimationFrame(ensurePlaying);
      }
    };

    const onMediaReady = () => ensurePlaying();

    video.addEventListener("pause", onPause);
    video.addEventListener("ended", ensurePlaying);
    video.addEventListener("loadeddata", onMediaReady);
    video.addEventListener("canplay", onMediaReady);
    video.addEventListener("stalled", onMediaReady);

    retryTimer = window.setInterval(ensurePlaying, 800);
    startTimer = window.setTimeout(ensurePlaying, playDelayMs);

    return () => {
      cancelled = true;
      window.clearInterval(retryTimer);
      window.clearTimeout(startTimer);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", ensurePlaying);
      video.removeEventListener("loadeddata", onMediaReady);
      video.removeEventListener("canplay", onMediaReady);
      video.removeEventListener("stalled", onMediaReady);
      video.pause();
    };
  }, [videoRef, playDelayMs, forcePaused]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (forcePaused) {
      video.pause();
      return;
    }

    playMuted(video);
  }, [forcePaused, videoRef]);
}

/**
 * Autoplay muted reel videos while their card is visible in the horizontal strip.
 */
export function useVisibleVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  {
    forcePaused = false,
    visibilityRatio = 0.05,
    scrollRootRef,
    playDelayMs = 0,
  }: UseVisibleVideoOptions = {}
) {
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    let rafId = 0;
    let retryTimer = 0;
    let playTimer = 0;
    let cancelled = false;

    const syncPlayback = () => {
      if (cancelled || !videoRef.current || !containerRef.current) return;

      if (forcePaused) {
        videoRef.current.pause();
        return;
      }

      const strip = scrollRootRef?.current ?? null;
      const visible = isVisibleInStrip(
        containerRef.current,
        strip,
        visibilityRatio
      );

      if (visible) {
        if (videoRef.current.paused) {
          playMuted(videoRef.current);
        }
      } else {
        videoRef.current.pause();
      }
    };

    const scheduleSync = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncPlayback);
    };

    const startRetryLoop = () => {
      window.clearInterval(retryTimer);
      retryTimer = window.setInterval(() => {
        if (cancelled || !videoRef.current || !containerRef.current) return;
        if (forcePaused) return;

        const strip = scrollRootRef?.current ?? null;
        const { overlap } = getVisibleOverlap(containerRef.current, strip);

        if (overlap > 1 && videoRef.current.paused) {
          playMuted(videoRef.current);
        }
      }, 1200);
    };

    const strip = scrollRootRef?.current;
    strip?.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync, { passive: true });

    const onMediaReady = () => scheduleSync();
    video.addEventListener("loadeddata", onMediaReady);
    video.addEventListener("canplay", onMediaReady);

    const observer = new IntersectionObserver(
      () => {
        scheduleSync();
      },
      {
        root: strip,
        threshold: [0, 0.05, 0.15, 0.35, 0.55, 0.75, 1],
      }
    );

    observer.observe(container);
    startRetryLoop();

    playTimer = window.setTimeout(() => {
      scheduleSync();
    }, playDelayMs);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(playTimer);
      window.clearInterval(retryTimer);
      strip?.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      video.removeEventListener("loadeddata", onMediaReady);
      video.removeEventListener("canplay", onMediaReady);
      observer.disconnect();
      video.pause();
    };
  }, [
    videoRef,
    containerRef,
    forcePaused,
    visibilityRatio,
    scrollRootRef,
    playDelayMs,
  ]);

  useEffect(() => {
    if (forcePaused) {
      videoRef.current?.pause();
    }
  }, [forcePaused, videoRef]);
}
