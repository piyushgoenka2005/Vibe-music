"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  MARKETING_HERO_FALLBACK,
  MARKETING_HERO_ROTATE_MS,
  MARKETING_HERO_SLIDES,
} from "@/data/marketingHeroSlides";

export default function PremiumHeroRotatingVisual() {
  const slides = MARKETING_HERO_SLIDES;
  const count = slides.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedSrc, setFailedSrc] = useState<Record<string, boolean>>({});

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActiveIndex(((index % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const timer = window.setInterval(goNext, MARKETING_HERO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count, isPaused, goNext]);

  useEffect(() => {
    const nextSlide = slides[(activeIndex + 1) % count];
    if (!nextSlide) return;
    const preload = new window.Image();
    preload.src = nextSlide.src;
  }, [activeIndex, count, slides]);

  if (count === 0) return null;

  return (
    <div
      className="premium-hero__slideshow"
      aria-live="polite"
      aria-atomic="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        return (
          <Link
            key={`${slide.href}-${index}`}
            href={slide.href}
            className={`premium-hero__image premium-hero__slide premium-hero__slide-link${isActive ? " premium-hero__slide--active" : ""}${slide.fit === "cover" ? " premium-hero__slide--cover" : ""}`}
            aria-hidden={!isActive}
            tabIndex={isActive ? 0 : -1}
            aria-label={slide.alt}
          >
            <Image
              src={failedSrc[slide.src] ? MARKETING_HERO_FALLBACK : slide.src}
              alt=""
              fill
              sizes="(max-width: 767px) 90vw, 480px"
              priority={index === 0}
              style={slide.objectPosition ? { objectPosition: slide.objectPosition } : undefined}
              onError={() =>
                setFailedSrc((prev) => ({ ...prev, [slide.src]: true }))
              }
            />
          </Link>
        );
      })}

      {count > 1 ? (
        <div className="premium-hero__dots" role="tablist" aria-label="Hero images">
          {slides.map((slide, index) => (
            <button
              key={`hero-dot-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show image ${index + 1}: ${slide.alt}`}
              className={`premium-hero__dot${index === activeIndex ? " premium-hero__dot--active" : ""}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
