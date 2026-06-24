"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/gp9/lib/utils";

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  ariaLabel?: string;
  /** Start loading and playing as soon as mounted (hero, pinned sections) */
  priority?: boolean;
  /** Keep playing/resume while the element is in the viewport */
  keepPlaying?: boolean;
}

export function LazyVideo({
  src,
  poster,
  className,
  ariaLabel,
  priority = false,
  keepPlaying = false,
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const inViewRef = useRef(priority);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const shouldStayPlaying = priority || keepPlaying;

    const tryPlay = () => {
      if (!inViewRef.current && !priority) return;
      if (el.readyState >= 2) {
        el.play().catch(() => {});
      }
    };

    const onLoaded = () => tryPlay();
    const onEnded = () => {
      if (el.loop) tryPlay();
    };
    const onPause = () => {
      if (shouldStayPlaying && inViewRef.current && !el.ended) {
        requestAnimationFrame(tryPlay);
      }
    };

    el.addEventListener("loadeddata", onLoaded);
    el.addEventListener("canplay", onLoaded);
    el.addEventListener("canplaythrough", onLoaded);
    el.addEventListener("ended", onEnded);
    if (shouldStayPlaying) {
      el.addEventListener("pause", onPause);
    }

    if (priority) {
      inViewRef.current = true;
      tryPlay();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;

        if (entry.isIntersecting) {
          if (el.readyState < 2) {
            el.preload = "auto";
            el.load();
          }
          tryPlay();
        } else if (!shouldStayPlaying) {
          el.pause();
        }
      },
      {
        threshold: [0, 0.12, 0.25],
        rootMargin: priority || keepPlaying ? "15% 0px 15% 0px" : "0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      el.removeEventListener("loadeddata", onLoaded);
      el.removeEventListener("canplay", onLoaded);
      el.removeEventListener("canplaythrough", onLoaded);
      el.removeEventListener("ended", onEnded);
      if (shouldStayPlaying) {
        el.removeEventListener("pause", onPause);
      }
    };
  }, [priority, keepPlaying, src]);

  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      preload={priority || keepPlaying ? "auto" : "metadata"}
      poster={poster}
      aria-label={ariaLabel}
      className={cn(className)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
