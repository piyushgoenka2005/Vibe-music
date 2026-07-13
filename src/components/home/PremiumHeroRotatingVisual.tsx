"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  MARKETING_HERO_FALLBACK,
  MARKETING_HERO_SLIDES,
} from "@/data/marketingHeroSlides";
import { cdnThumbUrl } from "@/lib/images";

const MOSAIC_COUNT = 4;
const MOSAIC_WIDTH = 640;

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

export default function PremiumHeroRotatingVisual() {
  const slides = MARKETING_HERO_SLIDES.slice(0, MOSAIC_COUNT);
  const [failedSrc, setFailedSrc] = useState<Record<string, boolean>>({});

  if (slides.length === 0) return null;

  return (
    <div className="premium-hero__mosaic" aria-label="Featured products">
      {slides.map((slide, index) => {
        const title = slide.title ?? slide.alt;
        const description = slide.description ?? slide.alt;
        const rawSrc = failedSrc[slide.src] ? MARKETING_HERO_FALLBACK : slide.src;
        const src = cdnThumbUrl(rawSrc, MOSAIC_WIDTH);
        const usePlainImg = src.startsWith("/api/media/thumb");

        return (
          <Link
            key={`${slide.href}-${index}`}
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
            {usePlainImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: slide.fit === "cover" ? "cover" : "contain",
                  ...(slide.objectPosition
                    ? { objectPosition: slide.objectPosition }
                    : null),
                }}
                onError={() =>
                  setFailedSrc((prev) => ({ ...prev, [slide.src]: true }))
                }
              />
            ) : (
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 1023px) 50vw, 28vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                style={
                  slide.objectPosition
                    ? { objectPosition: slide.objectPosition }
                    : undefined
                }
                onError={() =>
                  setFailedSrc((prev) => ({ ...prev, [slide.src]: true }))
                }
              />
            )}
            <span className="premium-hero__mosaic-meta" aria-hidden="true">
              {slide.brand ? (
                <span className="premium-hero__mosaic-brand">{slide.brand}</span>
              ) : null}
              <span className="premium-hero__mosaic-title">{title}</span>
              <span className="premium-hero__mosaic-desc">{description}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
