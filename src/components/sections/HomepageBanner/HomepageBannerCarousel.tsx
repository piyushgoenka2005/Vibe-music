"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import type { HomepageBanner } from "@/types/banner";
import "./homepage-banner.css";

const INTERVAL_MS = 6000;

interface HomepageBannerCarouselProps {
  banners: HomepageBanner[];
}

export default function HomepageBannerCarousel({
  banners,
}: HomepageBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const count = banners.length;
  const current = banners[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActiveIndex(((index % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const timer = window.setInterval(goNext, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [count, isPaused, goNext]);

  if (!current) return null;

  return (
    <section
      className="hp-banner"
      aria-label="Homepage promotions"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="hp-banner__viewport">
        {banners.map((banner, index) => {
          const isActive = index === activeIndex;
          const href = resolveLinkHref(banner.ctaLink);

          return (
            <article
              key={banner.id}
              className={`hp-banner__slide${isActive ? " hp-banner__slide--active" : ""}`}
              aria-hidden={!isActive}
            >
              <picture>
                {banner.mobileImage ? (
                  <source media="(max-width: 768px)" srcSet={banner.mobileImage} />
                ) : null}
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="hp-banner__image"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </picture>
              <div className="hp-banner__scrim" aria-hidden="true" />
              <div className="hp-banner__content">
                {banner.subtitle ? (
                  <p className="hp-banner__subtitle">{banner.subtitle}</p>
                ) : null}
                <h2 className="hp-banner__title">{banner.title}</h2>
                <Link href={href} className="hp-banner__cta">
                  {banner.ctaText}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="hp-banner__nav hp-banner__nav--prev"
            onClick={goPrev}
            aria-label="Previous banner"
          >
            ‹
          </button>
          <button
            type="button"
            className="hp-banner__nav hp-banner__nav--next"
            onClick={goNext}
            aria-label="Next banner"
          >
            ›
          </button>
          <div className="hp-banner__dots" role="tablist" aria-label="Banner slides">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show banner ${index + 1}: ${banner.title}`}
                className={`hp-banner__dot${index === activeIndex ? " hp-banner__dot--active" : ""}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
