"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import RevealGroup from "@/components/layout/RevealGroup";
import type { BigNamesDealBrand } from "@/data/bigNamesDeals";

function BigNamesDealItem({
  item,
  index,
}: {
  item: BigNamesDealBrand;
  index: number;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div
      className="big-names-deals__item"
      role="listitem"
      style={{ "--big-names-index": index } as CSSProperties}
    >
      <Link
        aria-label={`Shop ${item.brand} deals`}
        className="big-names-deals__link"
        href={item.href}
      >
        <div className="big-names-deals__spotlight" aria-hidden />
        <div className="big-names-deals__logo-wrap">
          {!logoFailed ? (
            <Image
              alt=""
              className="big-names-deals__logo"
              height={28}
              onError={() => setLogoFailed(true)}
              src={item.logo}
              style={{ width: "auto", height: "auto" }}
              width={120}
            />
          ) : null}
          {logoFailed ? (
            <span className="big-names-deals__brand-fallback">{item.brand}</span>
          ) : null}
        </div>
        <div className="big-names-deals__hang-wrap">
          <span className="big-names-deals__hanger" aria-hidden>
            <span className="big-names-deals__hanger-hook" />
            <span className="big-names-deals__hanger-plate" />
          </span>
          <div className="big-names-deals__product-stage">
            <span className="big-names-deals__floor-shadow" aria-hidden />
            <span
              className={`big-names-deals__product-shadow${item.blendMultiply ? " big-names-deals__product-shadow--blend" : ""}`}
            >
              <span
                className={`big-names-deals__product-wrap${item.blendMultiply ? " big-names-deals__product-wrap--blend" : ""}`}
              >
                <img
                  alt={item.productAlt}
                  className="big-names-deals__product"
                  decoding="async"
                  loading={index < 2 ? "eager" : "lazy"}
                  src={item.product}
                />
              </span>
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
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
    const track = trackRef.current;
    if (!track) return;

    updateActiveIndex();
    track.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    return () => {
      track.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
    };
  }, [updateActiveIndex]);

  const scrollToIndex = (index: number) => {
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
      <div ref={trackRef} className="big-names-deals__showcase-scroll scrollbar-minimal">
        <RevealGroup className="big-names-deals__showcase" role="list">
          {items.map((item, index) => (
            <BigNamesDealItem key={item.key} index={index} item={item} />
          ))}
        </RevealGroup>
      </div>

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
    </>
  );
}
