"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    window.dispatchEvent(new Event("site-header:sync"));
  }, []);

  // Preload upcoming slides so rotations and navigation are instant without black flash
  useEffect(() => {
    if (typeof window === "undefined" || slideCount <= 1) return;
    const isMobile = window.innerWidth <= 767;
    const nextIndices = [
      (activeIndex + 1) % slideCount,
      (activeIndex + 2) % slideCount,
      (activeIndex - 1 + slideCount) % slideCount,
    ];
    for (const idx of nextIndices) {
      const s = slides[idx];
      if (!s) continue;
      const target = isMobile && s.mobileSrc ? s.mobileSrc : s.srcOptimized || s.src;
      if (target && !target.startsWith("data:")) {
        const img = new window.Image();
        img.src = target;
      }
    }
  }, [activeIndex, slides, slideCount]);

  // Always open on slide 0. Do not advance while the page-load
  // splash covers the storefront, then reset and start rotation when it lifts.
  useEffect(() => {
    if (reduceMotion || slideCount <= 1) return;

    let timer = 0;
    let observer: MutationObserver | null = null;

    const startRotation = () => {
      setActiveIndex(0);
      timer = window.setInterval(() => {
        setActiveIndex((current) => (current + 1) % slideCount);
      }, HOMEPAGE_BANNER_ROTATION_MS);
    };

    if (!isSplashCovering()) {
      startRotation();
    } else {
      observer = new MutationObserver(() => {
        if (!isSplashCovering()) {
          observer?.disconnect();
          observer = null;
          startRotation();
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    return () => {
      if (timer) window.clearInterval(timer);
      observer?.disconnect();
    };
  }, [reduceMotion, slideCount]);

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
          const shouldPreload = index <= 1 || isActive || index === (activeIndex + 1) % slideCount;
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
                {currentSrcOptimized ? (
                  <picture className="homepage-banner-hero__picture">
                    {currentMobileSrc ? (
                      <source media="(max-width: 767px)" srcSet={currentMobileSrc} />
                    ) : null}
                    <source type="image/webp" srcSet={currentSrcOptimized} />
                    <img
                      src={currentSrc}
                      alt={slide.alt}
                      loading={shouldPreload ? "eager" : "lazy"}
                      fetchPriority={isFirstSlide ? "high" : "auto"}
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
