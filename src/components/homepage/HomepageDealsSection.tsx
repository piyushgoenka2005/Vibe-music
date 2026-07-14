"use client";

import Link from "next/link";
import DealProductCard from "@/components/homepage/DealProductCard";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import { useHorizontalScroller } from "@/hooks/useHorizontalScroller";
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
  const {
    scrollerRef,
    hasOverflow,
    canScrollPrev,
    canScrollNext,
    scrollByCard,
    scrollerProps,
  } = useHorizontalScroller(section.key, products.length);

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
            {...scrollerProps}
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
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  scrollByCard(-1);
                }}
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
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  scrollByCard(1);
                }}
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
