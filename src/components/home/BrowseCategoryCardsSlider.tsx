"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BrowseCategoryCard } from "@/data/browseCategoryCards";
import { attachAxisLockedRailScroll } from "@/lib/axisLockedRailScroll";
import { attachHorizontalWheelScroll } from "@/lib/horizontalWheelScroll";

interface BrowseCategoryCardsSliderProps {
  items: BrowseCategoryCard[];
}

function prefersFinePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export default function BrowseCategoryCardsSlider({
  items,
}: BrowseCategoryCardsSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const slide = track.querySelector<HTMLElement>(".category-card");
    if (!slide) return;

    const slideWidth = slide.offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 10;
    const index = Math.round(track.scrollLeft / (slideWidth + gap));
    setActiveIndex(Math.min(items.length - 1, Math.max(0, index)));
  }, [items.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateActiveIndex();
    track.addEventListener("scroll", updateActiveIndex, { passive: true });
    window.addEventListener("resize", updateActiveIndex);

    // Mouse/trackpad: axis-lock + wheel assist.
    // Touch phones: native overflow scroll (momentum + snap) — smoother.
    const usePointerDrag = prefersFinePointer();
    const detachAxis = usePointerDrag
      ? attachAxisLockedRailScroll(track)
      : () => undefined;
    const detachWheel = attachHorizontalWheelScroll(track);

    return () => {
      track.removeEventListener("scroll", updateActiveIndex);
      window.removeEventListener("resize", updateActiveIndex);
      detachAxis();
      detachWheel();
    };
  }, [updateActiveIndex]);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;

    const slide = track.querySelector<HTMLElement>(".category-card");
    if (!slide) return;

    const slideWidth = slide.offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 10;
    track.scrollTo({
      left: index * (slideWidth + gap),
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  return (
    <div className="category-cards category-cards--mobile-slider category-cards--columns-4 category-cards--has-image-overlay category-cards--has-title-overlay">
      <div
        ref={trackRef}
        className="category-cards-inner"
        role="list"
        aria-label="Browse by categories"
      >
        {items.map((item, index) => (
          <Link
            key={item.id}
            className="category-card"
            href={item.href}
            role="listitem"
            aria-label={`${index + 1} / ${items.length}: ${item.title}`}
            draggable={false}
          >
            <div className="category-card__image">
              <Image
                alt=""
                draggable={false}
                height={item.height}
                loading="lazy"
                role="presentation"
                sizes="(min-width: 1400px) 380px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 84vw"
                src={item.image}
                width={item.width}
              />
            </div>
            <h3 className="category-card__title">{item.title}</h3>
          </Link>
        ))}
      </div>

      <div
        className="category-cards__pagination"
        role="tablist"
        aria-label="Category slides"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Go to slide ${index + 1}: ${item.title}`}
            className={`category-cards__bullet${index === activeIndex ? " category-cards__bullet--active" : ""}`}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
