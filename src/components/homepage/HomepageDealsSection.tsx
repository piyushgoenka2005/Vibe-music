import Link from "next/link";
import DealProductCard from "@/components/homepage/DealProductCard";
import { resolveLinkHref } from "@/lib/routes";
import type { ResolvedHomepageSection } from "@/types/homepage";

interface HomepageDealsSectionProps {
  section: ResolvedHomepageSection;
}

export default function HomepageDealsSection({ section }: HomepageDealsSectionProps) {
  const products = section.products ?? [];
  const sliderId = `${section.sectionId}-slider`;

  return (
    <section
      id={section.sectionId}
      className="sale-events bg-gray50 text-black fw-containered self-spaced"
    >
      <section className="tile-block borderless">
        <div className="section-header">
          {section.accentLabel ? (
            <span className="accent-text text-red">{section.accentLabel}</span>
          ) : null}
          <h2 className="bg-gray50 text-black text-center">{section.title}</h2>
          <span className="accent bg-red"></span>
        </div>

        {section.subtitle ? (
          <p className="homepage-section__subtitle text-center">{section.subtitle}</p>
        ) : null}

        <div
          id={sliderId}
          className="tiles tiles--slider flex-container flex-row flex-nowrap scrollbar-minimal horizontal cols-4 product-peak-3"
        >
          {products.map((item, index) => (
            <DealProductCard key={item.id} item={item} slotPosition={index + 1} />
          ))}
        </div>

        <div data-prev-id={sliderId} className="tile--slider-controls prev bg-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
            <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2">
              <path d="M22.238 12.495l-7.739 7.739 7.739 7.739" fill="none" />
            </g>
          </svg>
        </div>
        <div data-next-id={sliderId} className="tile--slider-controls next bg-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
            <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2">
              <path d="M17.762 27.505l7.739-7.739-7.739-7.739" fill="none" />
            </g>
          </svg>
        </div>

        {section.ctaText && section.ctaLink ? (
          <div className="section-cta">
            <Link
              href={resolveLinkHref(section.ctaLink)}
              className="btn btn-default btn-red weight-demi"
            >
              {section.ctaText}
            </Link>
          </div>
        ) : null}
      </section>
    </section>
  );
}
