"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import ProductPageLink from "@/components/navigation/ProductPageLink";
import RevealGroup from "@/components/layout/RevealGroup";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import type { BigNamesDealItem } from "@/lib/homepage/bigNamesDeals";
/** Slightly snappier than a typical 3–4s carousel. */
const AUTO_ADVANCE_MS = 2200;
/** Brief pause after swipe / dot tap — auto keeps running alongside manual control. */
const RESUME_AFTER_IDLE_MS = 1600;

function getSlides(track: HTMLElement): HTMLElement[] {
  return Array.from(track.querySelectorAll<HTMLElement>(".big-names-deals__item"));
}

/** Left offset that centers a slide in the track (matches scroll-snap-align: center). */
function centeredScrollLeft(track: HTMLElement, slide: HTMLElement): number {
  const delta =
    slide.getBoundingClientRect().left +
    slide.offsetWidth / 2 -
    (track.getBoundingClientRect().left + track.clientWidth / 2);
  const max = Math.max(0, track.scrollWidth - track.clientWidth);
  return Math.min(max, Math.max(0, track.scrollLeft + delta));
}

function nearestSlideIndex(track: HTMLElement): number {
  const slides = getSlides(track);
  if (slides.length === 0) return 0;

  const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;

  slides.forEach((slide, index) => {
    const center = slide.getBoundingClientRect().left + slide.offsetWidth / 2;
    const dist = Math.abs(center - trackCenter);
    if (dist < bestDist) {
      bestDist = dist;
      best = index;
    }
  });

  return best;
}

function BigNamesDealItem({ item, index }: { item: BigNamesDealItem; index: number }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const blendMultiply = item.blendMultiply ?? false;

  return (
    <div
      className="big-names-deals__item"
      role="listitem"
      style={{ "--big-names-index": String(index) } as CSSProperties}
    >
      <ProductPageLink
        aria-label={`Shop ${item.brand} — open product`}
        className="big-names-deals__link"
        href={item.href}
        tabIndex={0}
      >
        <div className="big-names-deals__spotlight" aria-hidden />
        <div className="big-names-deals__logo-wrap">
          {!logoFailed && item.logo ? (
            <Image
              alt=""
              className="big-names-deals__logo"
              height={28}
              onError={() => setLogoFailed(true)}
              src={item.logo}
              style={{ width: "auto", height: "auto" }}
              unoptimized
              width={120}
            />
          ) : (
            <span className="big-names-deals__brand-fallback">{item.brand}</span>
          )}
        </div>
        <div className="big-names-deals__hang-wrap">
          <div className="big-names-deals__product-stage">
            <span
              className={`big-names-deals__product-shadow${blendMultiply ? " big-names-deals__product-shadow--blend" : ""}`}
            >
              <span
                className={`big-names-deals__product-wrap${blendMultiply ? " big-names-deals__product-wrap--blend" : ""}`}
              >
                <StorefrontThumbImage
                  className="big-names-deals__product"
                  fallbackSrc={item.productFallback}
                  fetchPriority={index < 5 ? "high" : "auto"}
                  height={480}
                  loading={index < 5 ? "eager" : "lazy"}
                  sizes="(max-width: 1023px) 82vw, 18vw"
                  src={item.product}
                  width={480}
                />
              </span>
            </span>
          </div>
        </div>
      </ProductPageLink>
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
  const rootRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef(0);
  const draggingRef = useRef(false);
  const inViewRef = useRef(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const enableAuto = isMobileViewport && !reduceMotion && items.length > 1;

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setActiveIndex(nearestSlideIndex(track));
  }, []);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current;
    if (!track) return;

    const slides = getSlides(track);
    if (slides.length === 0) return;

    const next = ((index % slides.length) + slides.length) % slides.length;
    const slide = slides[next];
    if (!slide) return;

    track.scrollTo({
      left: centeredScrollLeft(track, slide),
      behavior,
    });
    setActiveIndex(next);
  }, []);

  const pauseAuto = useCallback((ms = RESUME_AFTER_IDLE_MS) => {
    pauseUntilRef.current = Math.max(pauseUntilRef.current, Date.now() + ms);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateActiveIndex();
    track.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    // Do NOT setPointerCapture — it cancels native overflow touch scrolling on mobile.
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      draggingRef.current = true;
      pauseAuto();
    };
    const onPointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      pauseAuto();
      window.requestAnimationFrame(updateActiveIndex);
    };
    const onWheel = () => pauseAuto();

    track.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      track.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      track.removeEventListener("wheel", onWheel);
    };
  }, [pauseAuto, updateActiveIndex]);

  /* Only autoplay while the section is on screen. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enableAuto) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry?.isIntersecting ?? false;
      },
      { threshold: 0.35 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [enableAuto]);

  /* Center the first (and current) slide once layout is ready — scrollLeft=0 leaves slide 0 left-biased. */
  useEffect(() => {
    if (!enableAuto) return undefined;
    const track = trackRef.current;
    if (!track) return undefined;

    const centerCurrent = () => {
      const index = nearestSlideIndex(track);
      scrollToIndex(index, "instant");
    };

    centerCurrent();
    const raf = window.requestAnimationFrame(centerCurrent);
    window.addEventListener("resize", centerCurrent);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", centerCurrent);
    };
  }, [enableAuto, items.length, scrollToIndex]);

  /* Mobile: auto-advance + native swipe / dots at the same time. */
  useEffect(() => {
    if (!enableAuto) return undefined;

    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (!inViewRef.current) return;
      if (Date.now() < pauseUntilRef.current) return;
      if (draggingRef.current) return;

      const track = trackRef.current;
      if (!track) return;

      // Keyboard a11y only — touch focus on links must not kill autoplay.
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        track.contains(active) &&
        active.matches(":focus-visible")
      ) {
        return;
      }

      const current = nearestSlideIndex(track);
      scrollToIndex(current + 1);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(id);
  }, [enableAuto, scrollToIndex]);

  return (
    <div ref={rootRef} className="big-names-deals__showcase-root">
      <div
        ref={trackRef}
        className="big-names-deals__showcase-scroll"
        role={enableAuto ? "region" : undefined}
        aria-roledescription={enableAuto ? "carousel" : undefined}
        aria-label={enableAuto ? "Brand guitar deals" : undefined}
        style={
          {
            "--big-names-item-count": String(Math.max(1, items.length)),
          } as CSSProperties
        }
      >
        <RevealGroup className="big-names-deals__showcase" role="list">
          {items.map((item, index) => (
            <BigNamesDealItem key={item.key} index={index} item={item} />
          ))}
        </RevealGroup>
      </div>

      {items.length > 1 ? (
        <div className="big-names-deals__pagination" role="group" aria-label="Brand guitars">
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`Show guitar ${index + 1}: ${item.productAlt || item.brand}`}
              className={`big-names-deals__dot${index === activeIndex ? " big-names-deals__dot--active" : ""}`}
              onClick={() => {
                pauseAuto();
                scrollToIndex(index);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
