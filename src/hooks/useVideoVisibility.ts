"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

interface UseVideoVisibilityOptions {
  threshold?: number;
  rootMargin?: string;
  forcePaused?: boolean;
}

interface UseVideoVisibilityResult {
  containerRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  isVisible: boolean;
  shouldLoad: boolean;
}

function tryPlay(video: HTMLVideoElement) {
  video.muted = true;
  video.defaultMuted = true;
  return video.play().catch(() => undefined);
}

export function useVideoVisibility(
  options: UseVideoVisibilityOptions = {}
): UseVideoVisibilityResult {
  const { threshold = 0.2, rootMargin = "120px 0px", forcePaused = false } =
    options;

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        setIsVisible(visible);
        if (visible) setShouldLoad(true);
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    const onCanPlay = () => {
      if (isVisible && !forcePaused) void tryPlay(video);
    };

    video.addEventListener("canplay", onCanPlay);

    if (forcePaused) {
      video.pause();
    } else if (isVisible) {
      void tryPlay(video);
    } else {
      video.pause();
    }

    return () => video.removeEventListener("canplay", onCanPlay);
  }, [isVisible, shouldLoad, forcePaused]);

  useEffect(() => {
    if (!forcePaused) return;
    videoRef.current?.pause();
  }, [forcePaused]);

  useEffect(() => {
    function onPageVisibilityChange() {
      const video = videoRef.current;
      if (!video || !shouldLoad) return;
      if (document.hidden) {
        video.pause();
      } else if (!forcePaused && isVisible) {
        void tryPlay(video);
      }
    }

    document.addEventListener("visibilitychange", onPageVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onPageVisibilityChange);
  }, [isVisible, shouldLoad, forcePaused]);

  return { containerRef, videoRef, isVisible, shouldLoad };
}
