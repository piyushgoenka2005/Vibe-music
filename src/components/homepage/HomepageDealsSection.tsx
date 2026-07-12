import Link from "next/link";
import DealProductCard from "@/components/homepage/DealProductCard";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import { ROUTES, resolveLinkHref } from "@/lib/routes";
import type { ResolvedHomepageSection } from "@/types/homepage";

interface HomepageDealsSectionProps {
  section: ResolvedHomepageSection;
}

export default function HomepageDealsSection({ section }: HomepageDealsSectionProps) {
  const products = section.products ?? [];
  const sliderId = `${section.sectionId}-slider`;
  const titleId = `${section.sectionId}-title`;
  const ctaText = section.ctaText ?? "Shop All Deals";
  const ctaLink = resolveLinkHref(section.ctaLink || ROUTES.deals);

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
            className="homepage-deals-section__track tiles tiles--slider flex-container flex-row flex-nowrap scrollbar-minimal horizontal cols-4 product-peak-3"
            id={sliderId}
          >
            {products.map((item, index) => (
              <DealProductCard key={item.id} item={item} slotPosition={index + 1} />
            ))}
          </div>

          <div
            className="tile--slider-controls prev bg-white homepage-deals-section__nav homepage-deals-section__nav--prev"
            data-prev-id={sliderId}
          >
            <svg aria-hidden xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2">
                <path d="M22.238 12.495l-7.739 7.739 7.739 7.739" fill="none" />
              </g>
            </svg>
          </div>
          <div
            className="tile--slider-controls next bg-white homepage-deals-section__nav homepage-deals-section__nav--next"
            data-next-id={sliderId}
          >
            <svg aria-hidden xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2">
                <path d="M17.762 27.505l7.739-7.739-7.739-7.739" fill="none" />
              </g>
            </svg>
          </div>
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
