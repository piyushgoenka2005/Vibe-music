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

function BigNamesDealItem({
  item,
  index,
  isDuplicate = false,
}: {
  item: BigNamesDealItem;
  index: number;
  isDuplicate?: boolean;
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
      aria-hidden={isDuplicate ? true : undefined}
      style={{ "--big-names-index": String(index) } as CSSProperties}
    >
      <Link
        aria-label={`Shop ${item.brand} — open product`}
        className="big-names-deals__link"
        href={item.href}
        prefetch
        tabIndex={isDuplicate ? -1 : undefined}
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
  const enableMobileAuto =
    isMobileViewport && !reduceMotion && items.length > 1;
  const showcaseItems = enableMobileAuto ? [...items, ...items] : items;
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollClassName = [
    "big-names-deals__showcase-scroll",
    "scrollbar-minimal",
    enableMobileAuto && "big-names-deals__showcase-scroll--mobile-auto",
  ]
    .filter(Boolean)
    .join(" ");

  const showcaseClassName = [
    "big-names-deals__showcase",
    enableMobileAuto && "big-names-deals__showcase--mobile-auto",
  ]
    .filter(Boolean)
    .join(" ");

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const slide = track.querySelector<HTMLElement>(".big-names-deals__item");
    if (!slide) return;

    const slideWidth = slide.offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const index = Math.round(track.scrollLeft / (slideWidth + gap));
    setActiveIndex(Math.min(items.length - 1, Math.max(0, index)));
  }, [items.length]);

  useEffect(() => {
    if (enableMobileAuto) return undefined;

    const track = trackRef.current;
    if (!track) return;

    updateActiveIndex();
    track.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    return () => {
      track.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, [enableMobileAuto, updateActiveIndex]);

  const scrollToIndex = (index: number) => {
    if (enableMobileAuto) return;

    const track = trackRef.current;
    if (!track) return;

    const slide = track.querySelector<HTMLElement>(".big-names-deals__item");
    if (!slide) return;

    const slideWidth = slide.offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    track.scrollTo({
      left: index * (slideWidth + gap),
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  return (
    <>
      <div ref={trackRef} className={scrollClassName}>
        {enableMobileAuto ? (
          <div className={showcaseClassName} role="list">
            {showcaseItems.map((item, index) => (
              <BigNamesDealItem
                key={`${item.key}-${index}`}
                index={index % items.length}
                item={item}
                isDuplicate={index >= items.length}
              />
            ))}
          </div>
        ) : (
          <RevealGroup className={showcaseClassName} role="list">
            {items.map((item, index) => (
              <BigNamesDealItem key={item.key} index={index} item={item} />
            ))}
          </RevealGroup>
        )}
      </div>

      {!enableMobileAuto ? (
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
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
