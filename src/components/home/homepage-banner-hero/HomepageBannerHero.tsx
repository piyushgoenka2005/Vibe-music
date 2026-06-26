"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  HOMEPAGE_BANNER_ROTATION_MS,
  HOMEPAGE_BANNER_SLIDES,
} from "@/data/homepageBannerHero";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import "@/styles/homepage-banner-hero.css";

export default function HomepageBannerHero() {
  const [activeIndex, setActiveIndex] = useState(0);
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

  if (slideCount === 0) return null;

  return (
    <section
      className="homepage-banner-hero"
      data-vibe-section="homepage-banner-hero"
      aria-label="Featured promotions"
      aria-roledescription="carousel"
    >
      <div className="homepage-banner-hero__viewport">
        {HOMEPAGE_BANNER_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={slide.id}
              className={`homepage-banner-hero__slide${isActive ? " is-active" : ""}`}
              aria-hidden={!isActive}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="homepage-banner-hero__image"
              />
            </div>
          );
        })}
      </div>

      {slideCount > 1 ? (
        <div className="homepage-banner-hero__dots" role="tablist" aria-label="Banner slides">
          {HOMEPAGE_BANNER_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              className={`homepage-banner-hero__dot${index === activeIndex ? " is-active" : ""}`}
              aria-selected={index === activeIndex}
              aria-label={`Show banner ${index + 1}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
