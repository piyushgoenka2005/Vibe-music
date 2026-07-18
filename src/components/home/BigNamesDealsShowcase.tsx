"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import RevealGroup from "@/components/layout/RevealGroup";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import type { BigNamesDealBrand } from "@/data/bigNamesDeals";

const PRODUCT_FALLBACK = "/images/guitar-1.webp";
const MOBILE_AUTO_SPEED_PX = 0.55;
const MOBILE_AUTO_RESUME_MS = 1400;

function BigNamesDealItem({
  item,
  index,
  isDuplicate = false,
}: {
  item: BigNamesDealBrand;
  index: number;
  isDuplicate?: boolean;
}) {
  const [productSrc, setProductSrc] = useState(item.product);

  return (
    <div
      className="big-names-deals__item"
      role="listitem"
      aria-hidden={isDuplicate ? true : undefined}
      style={{ "--big-names-index": String(index) } as CSSProperties}
    >
      <Link
        aria-label={`Shop ${item.brand} deals`}
        className="big-names-deals__link"
        href={item.href}
        tabIndex={isDuplicate ? -1 : undefined}
      >
        <div className="big-names-deals__hang-wrap">
          <div className="big-names-deals__product-stage">
            <span className="big-names-deals__product-shadow">
              <Image
                alt={item.productAlt}
                className="big-names-deals__product"
                decoding="async"
                loading={index < 2 ? "eager" : "lazy"}
                src={productSrc}
                width={640}
                height={640}
                sizes="(max-width: 767px) 42vw, 320px"
                onError={() => {
                  if (productSrc !== PRODUCT_FALLBACK) {
                    setProductSrc(PRODUCT_FALLBACK);
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
  items: BigNamesDealBrand[];
}

export default function BigNamesDealsShowcase({ items }: BigNamesDealsShowcaseProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const isMobileViewport = useIsMobileViewport();
  const enableMobileAuto =
    isMobileViewport && !reduceMotion && items.length > 1;
  const showcaseItems = enableMobileAuto ? [...items, ...items] : items;
  const trackRef = useRef<HTMLDivElement>(null);
  const userPausedRef = useRef(false);
  const programmaticRef = useRef(false);
  const rafRef = useRef(0);
  const resumeTimerRef = useRef(0);
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
    const loopWidth = enableMobileAuto ? track.scrollWidth / 2 : track.scrollWidth;
    const normalizedLeft =
      enableMobileAuto && loopWidth > 0
        ? ((track.scrollLeft % loopWidth) + loopWidth) % loopWidth
        : track.scrollLeft;
    const index = Math.round(normalizedLeft / (slideWidth + gap));
    setActiveIndex(Math.min(items.length - 1, Math.max(0, index)));
  }, [enableMobileAuto, items.length]);

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

  useEffect(() => {
    if (!enableMobileAuto) return undefined;

    const track = trackRef.current;
    if (!track) return undefined;

    let running = true;

    const getLoopWidth = () => track.scrollWidth / 2;

    const normalizeScroll = () => {
      const loopWidth = getLoopWidth();
      if (loopWidth <= 0) return;

      programmaticRef.current = true;
      if (track.scrollLeft >= loopWidth) {
        track.scrollLeft -= loopWidth;
      } else if (track.scrollLeft < 0) {
        track.scrollLeft += loopWidth;
      }
      programmaticRef.current = false;
    };

    const pauseForUser = () => {
      userPausedRef.current = true;
      window.clearTimeout(resumeTimerRef.current);
    };

    const scheduleResume = () => {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = window.setTimeout(() => {
        normalizeScroll();
        userPausedRef.current = false;
        updateActiveIndex();
      }, MOBILE_AUTO_RESUME_MS);
    };

    const tick = () => {
      if (!running) return;

      if (!userPausedRef.current) {
        const loopWidth = getLoopWidth();
        if (loopWidth > track.clientWidth) {
          programmaticRef.current = true;
          track.scrollLeft += MOBILE_AUTO_SPEED_PX;
          if (track.scrollLeft >= loopWidth) {
            track.scrollLeft -= loopWidth;
          }
          programmaticRef.current = false;
        }
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    const onScroll = (event: Event) => {
      if (programmaticRef.current) return;
      if (!event.isTrusted) return;

      normalizeScroll();
      pauseForUser();
      scheduleResume();
      updateActiveIndex();
    };

    const onTouchStart = () => {
      pauseForUser();
    };

    const onTouchEnd = () => {
      scheduleResume();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        pauseForUser();
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        scheduleResume();
      }
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("touchstart", onTouchStart, { passive: true });
    track.addEventListener("touchend", onTouchEnd, { passive: true });
    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointerup", onPointerUp);
    window.addEventListener("resize", updateActiveIndex);

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      running = false;
      window.cancelAnimationFrame(rafRef.current);
      window.clearTimeout(resumeTimerRef.current);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("touchstart", onTouchStart);
      track.removeEventListener("touchend", onTouchEnd);
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, [enableMobileAuto, items.length, updateActiveIndex]);

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
