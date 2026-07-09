"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  HOMEPAGE_BANNER_ROTATION_MS,
  HOMEPAGE_BANNER_SLIDES,
} from "@/data/homepageBannerHero";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";

export default function HomepageBannerHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const reduceMotion = useHydrationSafeReducedMotion();
  const slideCount = HOMEPAGE_BANNER_SLIDES.length;

  const goTo = useCallback(
    (index: number) => {
      if (slideCount === 0) return;
      setActiveIndex(((index % slideCount) + slideCount) % slideCount);
    },
    [slideCount]
  );

  useEffect(() => {
    if (reduceMotion || slideCount <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, HOMEPAGE_BANNER_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [reduceMotion, slideCount]);

  useEffect(() => {
    window.dispatchEvent(new Event("site-header:sync"));
  }, []);

  if (slideCount === 0) return null;

  return (
    <section
      className="homepage-banner-hero"
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
        {HOMEPAGE_BANNER_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <Link
              key={slide.id}
              href={slide.href}
              className={`homepage-banner-hero__slide${isActive ? " is-active" : ""}`}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                loading="eager"
                sizes="100vw"
                className="homepage-banner-hero__image"
                style={
                  slide.objectPosition ? { objectPosition: slide.objectPosition } : undefined
                }
              />
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
