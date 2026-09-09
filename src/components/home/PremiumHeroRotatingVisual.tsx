"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MARKETING_HERO_SLIDES, type MarketingHeroSlide } from "@/data/marketingHeroSlides";
import { cdnThumbUrl } from "@/lib/images";

const MOSAIC_COUNT = 4;
const MOSAIC_WIDTH = 480;

const STATIC_HERO_FALLBACKS = [
  "/images/big-names-deals/gibson-product.webp",
  "/images/big-names-deals/epiphone-product.webp",
  "/images/big-names-deals/prs-product.webp",
  "/images/big-names-deals/ibanez-product.webp",
];

function badgeClassName(badge: string): string {
  const normalized = badge.toLowerCase();
  if (normalized.includes("bestseller")) {
    return "premium-hero__mosaic-badge premium-hero__mosaic-badge--bestseller";
  }
  if (normalized.includes("trending")) {
    return "premium-hero__mosaic-badge premium-hero__mosaic-badge--trending";
  }
  if (normalized.includes("new")) {
    return "premium-hero__mosaic-badge premium-hero__mosaic-badge--new";
  }
  return "premium-hero__mosaic-badge";
}

function HeroMosaicCell({ slide, index }: { slide: MarketingHeroSlide; index: number }) {
  const fallback = STATIC_HERO_FALLBACKS[index % STATIC_HERO_FALLBACKS.length]!;
  const candidates = useMemo(() => {
    const thumb = cdnThumbUrl(slide.src, MOSAIC_WIDTH);
    return Array.from(new Set([thumb, slide.src, fallback].filter(Boolean)));
  }, [slide.src, fallback]);

  const [attempt, setAttempt] = useState(0);
  const currentSrc = candidates[Math.min(attempt, candidates.length - 1)] ?? fallback;

  const title = slide.title ?? slide.alt;
  const description = slide.description ?? slide.alt;

  return (
    <Link
      href={slide.href}
      className={`premium-hero__mosaic-cell${
        slide.fit === "cover" ? " premium-hero__mosaic-cell--cover" : ""
      }`}
      aria-label={slide.alt}
    >
      {slide.badge ? (
        <span className={badgeClassName(slide.badge)} aria-hidden="true">
          {slide.badge}
        </span>
      ) : null}
      <div className="premium-hero__mosaic-cell__media">
        <Image
          src={currentSrc}
          alt=""
          fill
          unoptimized
          className="premium-hero__mosaic-photo"
          sizes="(max-width: 767px) 48vw, (max-width: 1023px) 240px, 260px"
          priority={index === 0}
          style={{
            objectFit: slide.fit === "cover" ? "cover" : "contain",
            ...(slide.objectPosition ? { objectPosition: slide.objectPosition } : null),
          }}
          onError={() => {
            if (attempt < candidates.length - 1) {
              setAttempt((c) => c + 1);
            }
          }}
        />
      </div>
      <span className="premium-hero__mosaic-meta" aria-hidden="true">
        {slide.brand ? (
          <span className="premium-hero__mosaic-brand">{slide.brand}</span>
        ) : null}
        <span className="premium-hero__mosaic-title">{title}</span>
        <span className="premium-hero__mosaic-desc">{description}</span>
      </span>
    </Link>
  );
}

export default function PremiumHeroRotatingVisual() {
  const slides = MARKETING_HERO_SLIDES.slice(0, MOSAIC_COUNT);

  if (slides.length === 0) return null;

  return (
    <div className="premium-hero__mosaic" aria-label="Featured products">
      {slides.map((slide, index) => (
        <HeroMosaicCell key={`${slide.href}-${index}`} slide={slide} index={index} />
      ))}
    </div>
  );
}
