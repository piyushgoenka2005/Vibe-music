"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HOMEPAGE_BANNER_ROTATION_MS,
  HOMEPAGE_BANNER_SLIDES,
  type HomepageBannerSlide,
} from "@/data/homepageBannerHero";
import { resolveLinkHref } from "@/lib/routes";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import { useIsClient } from "@/hooks/useIsClient";

const FALLBACK_BANNER_SRC = "/independence-day-special.png";
const FALLBACK_BANNER_WEBP = "/independence-day-special.webp";

interface HeroVideoProps {
  src: string;
  poster?: string;
  isActive: boolean;
  reduceMotion: boolean;
  preload: "auto" | "metadata";
  fit?: "contain" | "cover";
  objectPosition?: string;
  isSingleSlide: boolean;
  onEnded: () => void;
  onError: () => void;
}

function HeroVideo({
  src,
  poster,
  isActive,
  reduceMotion,
  preload,
  fit,
  objectPosition,
  isSingleSlide,
  onEnded,
  onError,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && !reduceMotion) {
      try {
        video.currentTime = 0;
      } catch {
        // Safe ignore if seeking fails before metadata loads
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Handled: browser autoplay restrictions or power saver
        });
      }
    } else {
      video.pause();
    }
  }, [isActive, reduceMotion]);

  const handleEnded = useCallback(() => {
    if (isSingleSlide) {
      if (videoRef.current) {
        try {
          videoRef.current.currentTime = 0;
        } catch {}
        videoRef.current.play().catch(() => {});
      }
    } else {
      onEnded();
    }
  }, [isSingleSlide, onEnded]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      autoPlay={isActive && !reduceMotion}
      muted
      loop={isSingleSlide}
      playsInline
      preload={preload}
      onEnded={handleEnded}
      onError={onError}
      className="homepage-banner-hero__video"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: fit ?? "cover",
        ...(objectPosition ? { objectPosition } : {}),
      }}
    />
  );
}

/** Keep in sync with `PageLoadSplash` class names. */
function isSplashCovering(): boolean {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  return (
    root.classList.contains("vibe-splash-pending") || root.classList.contains("vibe-splash-active")
  );
}

interface HomepageBannerHeroProps {
  slides?: HomepageBannerSlide[];
}

export default function HomepageBannerHero({
  slides = HOMEPAGE_BANNER_SLIDES,
}: HomepageBannerHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedSlideIds, setFailedSlideIds] = useState<Record<string, boolean>>({});
  const [failedVideoIds, setFailedVideoIds] = useState<Record<string, boolean>>({});
  const ready = useIsClient();
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const reduceMotion = useHydrationSafeReducedMotion();
  const slideCount = slides.length;

  const goTo = useCallback(
    (index: number) => {
      if (slideCount === 0) return;
      setActiveIndex(((index % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const handleImageError = useCallback((id: string) => {
    setFailedSlideIds((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleVideoError = useCallback((id: string) => {
    setFailedVideoIds((prev) => ({ ...prev, [id]: true }));
  }, []);

  useEffect(() => {
    window.dispatchEvent(new Event("site-header:sync"));
  }, []);

  // Preload adjacent slides only after the initial page load finishes so Slide 0 LCP isn't delayed
  useEffect(() => {
    if (typeof window === "undefined" || slideCount <= 1) return;

    let cancelled = false;
    let timer = 0;

    const preloadNeighbors = () => {
      if (cancelled) return;
      const isMobile = window.innerWidth <= 767;
      const nextIndices = [
        (activeIndex + 1) % slideCount,
        (activeIndex - 1 + slideCount) % slideCount,
      ];
      for (const idx of nextIndices) {
        const s = slides[idx];
        if (!s) continue;
        const target = isMobile && s.mobileSrc ? s.mobileSrc : s.srcOptimized || s.src;
        if (target && !target.startsWith("data:")) {
          const img = new window.Image();
          img.decoding = "async";
          img.src = target;
        }
      }
    };

    const schedulePreload = () => {
      timer = window.setTimeout(preloadNeighbors, 600);
    };

    if (document.readyState === "complete") {
      schedulePreload();
    } else {
      window.addEventListener("load", schedulePreload, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedulePreload);
      if (timer) window.clearTimeout(timer);
    };
  }, [activeIndex, slides, slideCount]);

  const [splashLifted, setSplashLifted] = useState(!isSplashCovering());

  useEffect(() => {
    if (splashLifted) return;

    let observer: MutationObserver | null = null;
    let failsafeTimer = 0;

    const onLift = () => {
      setSplashLifted(true);
      observer?.disconnect();
      observer = null;
      if (failsafeTimer) window.clearTimeout(failsafeTimer);
    };

    if (!isSplashCovering()) {
      onLift();
      return;
    }

    observer = new MutationObserver(() => {
      if (!isSplashCovering()) {
        onLift();
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    failsafeTimer = window.setTimeout(onLift, 2500);

    return () => {
      observer?.disconnect();
      if (failsafeTimer) window.clearTimeout(failsafeTimer);
    };
  }, [splashLifted]);

  // Automatic rotation:
  // - Video slides play completely until the end (onEnded triggers goTo(next)).
  // - Static image slides advance after HOMEPAGE_BANNER_ROTATION_MS (4s).
  // - If reduced motion is enabled or there is only 1 slide, rotation is disabled.
  useEffect(() => {
    if (!splashLifted || reduceMotion || slideCount <= 1) return;

    const currentSlide = slides[activeIndex];
    const isVideoSlide = Boolean(currentSlide?.videoUrl && !failedVideoIds[currentSlide.id]);

    // If current slide is a video, rotation is driven by video playback ending (onEnded).
    // Set a generous safety failsafe in case an external stream hangs indefinitely.
    if (isVideoSlide) {
      const failsafe = window.setTimeout(() => {
        goTo(activeIndex + 1);
      }, 120_000);
      return () => window.clearTimeout(failsafe);
    }

    // Static image slide: advance after standard rotation interval
    const timer = window.setTimeout(() => {
      goTo(activeIndex + 1);
    }, HOMEPAGE_BANNER_ROTATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeIndex, splashLifted, reduceMotion, slideCount, slides, failedVideoIds, goTo]);

  if (slideCount === 0) return null;

  return (
    <section
      className={`homepage-banner-hero${ready ? " is-ready" : ""}`}
      data-vibe-section="homepage-banner-hero"
      aria-label="Featured promotions"
      aria-roledescription="carousel"
    >
      <div
        className="homepage-banner-hero__viewport"
        onTouchEnd={(event) => {
          if (touchStartX == null || slideCount <= 1) return;
          const delta = event.changedTouches[0]?.clientX ?? touchStartX;
          const diff = delta - touchStartX;
          if (Math.abs(diff) > 48) {
            goTo(activeIndex + (diff < 0 ? 1 : -1));
          }
          setTouchStartX(null);
        }}
        onTouchStart={(event) => {
          setTouchStartX(event.touches[0]?.clientX ?? null);
        }}
      >
        {slides.map((slide, index) => {
          const isFirstSlide = index === 0;
          const isActive = index === activeIndex;
          const shouldPreload = isFirstSlide || isActive;
          const isFailed = Boolean(failedSlideIds[slide.id]);
          const currentSrc = isFailed ? FALLBACK_BANNER_SRC : slide.src;
          const currentSrcOptimized = isFailed
            ? FALLBACK_BANNER_WEBP
            : slide.srcOptimized ||
              (slide.src.endsWith(".webp") || slide.src.includes(".webp?") ? slide.src : undefined);
          const currentMobileSrc = isFailed ? FALLBACK_BANNER_WEBP : slide.mobileSrc;

          const hasCopy = Boolean(
            slide.title?.trim() || slide.subtitle?.trim() || slide.ctaText?.trim(),
          );
          return (
            <Link
              key={slide.id}
              href={resolveLinkHref(slide.href)}
              className={`homepage-banner-hero__slide${isActive ? " is-active" : ""}`}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              aria-label={
                slide.title?.trim()
                  ? `${slide.title}${slide.subtitle ? ` — ${slide.subtitle}` : ""}`
                  : slide.alt
              }
            >
              <div className="homepage-banner-hero__media">
                {slide.videoUrl && !failedVideoIds[slide.id] ? (
                  <HeroVideo
                    src={slide.videoUrl}
                    poster={currentSrcOptimized || currentSrc}
                    isActive={isActive}
                    reduceMotion={reduceMotion}
                    preload={shouldPreload ? "auto" : "metadata"}
                    fit={slide.fit}
                    objectPosition={slide.objectPosition}
                    isSingleSlide={slideCount <= 1}
                    onEnded={() => goTo(activeIndex + 1)}
                    onError={() => handleVideoError(slide.id)}
                  />
                ) : currentSrcOptimized ? (
                  <picture className="homepage-banner-hero__picture">
                    {currentMobileSrc ? (
                      <source media="(max-width: 767px)" srcSet={currentMobileSrc} />
                    ) : null}
                    <source type="image/webp" srcSet={currentSrcOptimized} />
                    <img
                      src={currentSrc}
                      alt={slide.alt}
                      loading={shouldPreload ? "eager" : "lazy"}
                      fetchPriority={isFirstSlide ? "high" : "low"}
                      decoding="async"
                      className="homepage-banner-hero__image"
                      onError={() => handleImageError(slide.id)}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: slide.fit ?? "cover",
                        ...(slide.objectPosition ? { objectPosition: slide.objectPosition } : {}),
                      }}
                    />
                  </picture>
                ) : (
                  <Image
                    src={currentSrc}
                    alt={slide.alt}
                    fill
                    sizes="100vw"
                    loading={shouldPreload ? "eager" : "lazy"}
                    priority={isFirstSlide}
                    unoptimized={
                      slide.src.includes("cdn.vibemusic.in") || slide.src.endsWith(".webp")
                    }
                    decoding="async"
                    className="homepage-banner-hero__image"
                    onError={() => handleImageError(slide.id)}
                    style={{
                      objectFit: slide.fit ?? "cover",
                      ...(slide.objectPosition ? { objectPosition: slide.objectPosition } : {}),
                    }}
                  />
                )}
              </div>
              {hasCopy ? (
                <div className="homepage-banner-hero__copy">
                  {slide.title ? (
                    <p className="homepage-banner-hero__title">{slide.title}</p>
                  ) : null}
                  {slide.subtitle ? (
                    <p className="homepage-banner-hero__subtitle">{slide.subtitle}</p>
                  ) : null}
                  {slide.ctaText ? (
                    <span className="homepage-banner-hero__cta">{slide.ctaText}</span>
                  ) : null}
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>

      {slideCount > 1 ? (
        <>
          <button
            type="button"
            className="homepage-banner-hero__nav homepage-banner-hero__nav--prev"
            aria-label="Previous banner"
            onClick={() => goTo(activeIndex - 1)}
          >
            <ChevronLeft size={22} strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className="homepage-banner-hero__nav homepage-banner-hero__nav--next"
            aria-label="Next banner"
            onClick={() => goTo(activeIndex + 1)}
          >
            <ChevronRight size={22} strokeWidth={2} aria-hidden />
          </button>
        </>
      ) : null}
    </section>
  );
}
