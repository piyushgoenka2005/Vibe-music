"use client";

import { useEffect, useRef, type RefObject } from "react";
import { cn } from "@/gp9/lib/utils";
import { getScrollZoneProgress } from "@/gp9/lib/scroll-engage";
import { subscribeScroll } from "@/gp9/lib/scroll-performance";

type ScrollScrubVideoProps = {
  src: string;
  poster?: string;
  zoneRef: RefObject<HTMLElement | null>;
  className?: string;
  ariaLabel?: string;
};

const SEEK_THRESHOLD = 0.028;
const SMOOTHING = 0.22;

function seekVideo(video: HTMLVideoElement, time: number) {
  const clamped = Math.max(0, Math.min(time, video.duration || time));
  if (Math.abs(video.currentTime - clamped) < SEEK_THRESHOLD) return;

  if (typeof video.fastSeek === "function") {
    video.fastSeek(clamped);
  } else {
    video.currentTime = clamped;
  }
}

export function ScrollScrubVideo({
  src,
  poster,
  zoneRef,
  className,
  ariaLabel,
}: ScrollScrubVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef(0);
  const readyRef = useRef(false);
  const targetTimeRef = useRef(0);
  const smoothTimeRef = useRef(0);
  const activeRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tick = () => {
      rafRef.current = null;

      if (!activeRef.current || !readyRef.current) return;

      const zone = zoneRef.current;
      if (!zone) return;

      targetTimeRef.current = getScrollZoneProgress(zone) * durationRef.current;
      smoothTimeRef.current +=
        (targetTimeRef.current - smoothTimeRef.current) * SMOOTHING;

      seekVideo(video, smoothTimeRef.current);

      const stillSettling =
        Math.abs(targetTimeRef.current - smoothTimeRef.current) > 0.012;

      if (activeRef.current && stillSettling) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const scheduleTick = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(tick);
    };

    const applyScrollFrame = () => {
      if (!activeRef.current || !readyRef.current) return;
      scheduleTick();
    };

    const primeVideo = () => {
      durationRef.current = video.duration;
      readyRef.current = Number.isFinite(durationRef.current) && durationRef.current > 0;
      video.pause();

      const zone = zoneRef.current;
      if (zone) {
        const initial = getScrollZoneProgress(zone) * durationRef.current;
        targetTimeRef.current = initial;
        smoothTimeRef.current = initial;
        seekVideo(video, initial);
      }

      video
        .play()
        .then(() => {
          video.pause();
          applyScrollFrame();
        })
        .catch(() => applyScrollFrame());
    };

    const onReady = () => primeVideo();

    video.addEventListener("loadedmetadata", onReady);
    if (video.readyState >= 1) onReady();

    const zoneObserver = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          scheduleTick();
        } else if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      },
      { rootMargin: "20% 0px 20% 0px", threshold: 0 }
    );

    if (zoneRef.current) zoneObserver.observe(zoneRef.current);

    const unsub = subscribeScroll(applyScrollFrame);

    return () => {
      unsub();
      zoneObserver.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      video.removeEventListener("loadedmetadata", onReady);
    };
  }, [src, zoneRef]);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      preload="auto"
      poster={poster}
      aria-label={ariaLabel}
      className={cn("transform-gpu will-change-[contents]", className)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
