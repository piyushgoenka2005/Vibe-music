"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RevealGroup from "@/components/layout/RevealGroup";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import type { BigNamesDealItem } from "@/lib/homepage/bigNamesDeals";
import { storefrontImageCandidates } from "@/lib/storefrontImages";

const PRODUCT_FALLBACK = "/images/guitar-1.webp";
const AUTO_ADVANCE_MS = 3500;
const RESUME_AFTER_IDLE_MS = 4500;

function BigNamesDealItem({
  item,
  index,
}: {
  item: BigNamesDealItem;
  index: number;
}) {
  const candidates = useMemo(
    () =>
      Array.from(
        new Set(
          [...storefrontImageCandidates(item.product, 640), PRODUCT_FALLBACK].filter(
            Boolean
          )
        )
      ),
    [item.product]
  );
  const [attempt, setAttempt] = useState(0);
  const productSrc =
    candidates[Math.min(attempt, candidates.length - 1)] ?? PRODUCT_FALLBACK;

  return (
    <div
      className="big-names-deals__item"
      role="listitem"
      style={{ "--big-names-index": String(index) } as CSSProperties}
    >
      <Link
        aria-label={`Shop ${item.brand} — open product`}
        className="big-names-deals__link"
        href={item.href}
        prefetch
      >
        <div className="big-names-deals__hang-wrap">
          <div className="big-names-deals__product-stage">
            <span className="big-names-deals__product-shadow">
              {/* Plain img avoids /_next/image CDN timeouts on large PNG masters */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={item.productAlt}
                className="big-names-deals__product"
                decoding="async"
                height={640}
                loading={index < 2 ? "eager" : "lazy"}
                src={productSrc}
                width={640}
                onError={() => {
                  if (attempt < candidates.length - 1) {
                    setAttempt((current) => current + 1);
                  }
                }}
              />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

interface BigNamesDealsShowcaseProps {
  items: BigNamesDealItem[];
}

export default function BigNamesDealsShowcase({ items }: BigNamesDealsShowcaseProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const isMobileViewport = useIsMobileViewport();
  const trackRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const enableAuto =
    isMobileViewport && !reduceMotion && items.length > 1;

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const slide = track.querySelector<HTMLElement>(".big-names-deals__item");
    if (!slide) return;

    const slideWidth = slide.offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    const stride = slideWidth + gap;
    if (stride <= 0) return;

    const index = Math.round(track.scrollLeft / stride);
    setActiveIndex(Math.min(items.length - 1, Math.max(0, index)));
  }, [items.length]);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const track = trackRef.current;
      if (!track) return;

      const slide = track.querySelector<HTMLElement>(".big-names-deals__item");
      if (!slide) return;

      const slideWidth = slide.offsetWidth;
      const gap =
        parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) ||
        0;
      const next = ((index % items.length) + items.length) % items.length;
      track.scrollTo({
        left: next * (slideWidth + gap),
        behavior,
      });
      setActiveIndex(next);
    },
    [items.length]
  );

  const pauseAuto = useCallback(() => {
    pauseUntilRef.current = Date.now() + RESUME_AFTER_IDLE_MS;
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateActiveIndex();
    track.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    const onInteract = () => pauseAuto();
    track.addEventListener("pointerdown", onInteract, { passive: true });
    track.addEventListener("touchstart", onInteract, { passive: true });
    track.addEventListener("wheel", onInteract, { passive: true });

    return () => {
      track.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
      track.removeEventListener("pointerdown", onInteract);
      track.removeEventListener("touchstart", onInteract);
      track.removeEventListener("wheel", onInteract);
    };
  }, [pauseAuto, updateActiveIndex]);

  useEffect(() => {
    if (!enableAuto) return undefined;

    const id = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      const track = trackRef.current;
      if (!track) return;

      // Don't fight an active finger drag
      if (track.matches(":active")) return;

      const slide = track.querySelector<HTMLElement>(".big-names-deals__item");
      if (!slide) return;

      const slideWidth = slide.offsetWidth;
      const gap =
        parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) ||
        0;
      const stride = slideWidth + gap;
      if (stride <= 0) return;

      const current = Math.round(track.scrollLeft / stride);
      const next = (current + 1) % items.length;
      track.scrollTo({
        left: next * stride,
        behavior: "smooth",
      });
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(id);
  }, [enableAuto, items.length]);

  return (
    <>
      <div
        ref={trackRef}
        className="big-names-deals__showcase-scroll scrollbar-minimal"
      >
        <RevealGroup className="big-names-deals__showcase" role="list">
          {items.map((item, index) => (
            <BigNamesDealItem key={item.key} index={index} item={item} />
          ))}
        </RevealGroup>
      </div>

      {items.length > 1 ? (
        <div
          className="big-names-deals__pagination"
          role="tablist"
          aria-label="Brand guitars"
        >
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show ${item.brand}`}
              className={`big-names-deals__dot${index === activeIndex ? " big-names-deals__dot--active" : ""}`}
              onClick={() => {
                pauseAuto();
                scrollToIndex(index);
              }}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
