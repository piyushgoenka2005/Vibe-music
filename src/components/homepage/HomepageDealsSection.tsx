"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import DealProductCard from "@/components/homepage/DealProductCard";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import { attachHorizontalWheelScroll } from "@/lib/horizontalWheelScroll";
import { ROUTES, resolveLinkHref } from "@/lib/routes";
import type { ResolvedHomepageSection } from "@/types/homepage";

interface HomepageDealsSectionProps {
  section: ResolvedHomepageSection;
}

export default function HomepageDealsSection({ section }: HomepageDealsSectionProps) {
  const products = section.products ?? [];
  const titleId = `${section.sectionId}-title`;
  const ctaText = section.ctaText ?? "Shop All Deals";
  const ctaLink = resolveLinkHref(section.ctaLink || ROUTES.deals);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const maxScroll = Math.ceil(scroller.scrollWidth - scroller.clientWidth);
    const overflow = maxScroll > 4;
    setHasOverflow(overflow);
    setCanScrollPrev(overflow && scroller.scrollLeft > 2);
    setCanScrollNext(overflow && scroller.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    updateScrollState();
    const raf = window.requestAnimationFrame(updateScrollState);
    scroller.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    const detachWheel = attachHorizontalWheelScroll(scroller);

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateScrollState);
    });
    resizeObserver.observe(scroller);

    return () => {
      window.cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver.disconnect();
      detachWheel();
    };
  }, [products.length, updateScrollState]);

  const scrollByCard = useCallback((direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const firstWrap = scroller.querySelector<HTMLElement>(
      ".homepage-deals-card-wrap"
    );
    const gap = Number.parseFloat(getComputedStyle(scroller).gap || "12") || 12;
    const amount =
      (firstWrap?.offsetWidth ?? Math.max(scroller.clientWidth * 0.8, 200)) + gap;
    scroller.scrollBy({ left: direction * amount, behavior: "smooth" });
  }, []);

  if (products.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={titleId}
      className="homepage-deals-section"
      id={section.sectionId}
    >
      <div className="homepage-deals-section__inner tile-block">
        <header className="homepage-deals-section__header">
          {section.accentLabel ? (
            <p className="premium-section-eyebrow homepage-deals-section__eyebrow">
              {section.accentLabel}
            </p>
          ) : null}
          <h2 className="homepage-deals-section__title" id={titleId}>
            {section.title}
          </h2>
          {section.subtitle ? (
            <p className="homepage-deals-section__subtitle">{section.subtitle}</p>
          ) : null}
        </header>

        <div className="homepage-deals-section__stage">
          <div
            ref={scrollerRef}
            className="homepage-deals-section__track tiles tiles--slider flex-container flex-row flex-nowrap scrollbar-minimal horizontal"
          >
            {products.map((item, index) => (
              <DealProductCard key={item.id} item={item} slotPosition={index + 1} />
            ))}
          </div>

          {hasOverflow ? (
            <>
              <button
                type="button"
                className={`homepage-deals-section__nav homepage-deals-section__nav--prev${
                  !canScrollPrev ? " disabled" : ""
                }`}
                aria-label="Scroll previous deals"
                disabled={!canScrollPrev}
                onClick={() => scrollByCard(-1)}
              >
                <svg aria-hidden xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                  <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2">
                    <path d="M22.238 12.495l-7.739 7.739 7.739 7.739" fill="none" />
                  </g>
                </svg>
              </button>
              <button
                type="button"
                className={`homepage-deals-section__nav homepage-deals-section__nav--next${
                  !canScrollNext ? " disabled" : ""
                }`}
                aria-label="Scroll next deals"
                disabled={!canScrollNext}
                onClick={() => scrollByCard(1)}
              >
                <svg aria-hidden xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                  <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2">
                    <path d="M17.762 27.505l7.739-7.739-7.739-7.739" fill="none" />
                  </g>
                </svg>
              </button>
            </>
          ) : null}
        </div>

        <div className="homepage-deals-section__cta-wrap">
          <Link
            className="premium-btn premium-btn--primary homepage-deals-section__cta"
            href={ctaLink}
          >
            {ctaText}
            {SECTION_CTA_ARROW}
          </Link>
        </div>
      </div>
    </section>
  );
}
