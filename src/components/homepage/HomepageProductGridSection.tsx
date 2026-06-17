import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import NewArrivalsProductCard from "@/components/homepage/NewArrivalsProductCard";
import Reveal from "@/components/layout/Reveal";
import type { ResolvedHomepageSection } from "@/types/homepage";

interface HomepageProductGridSectionProps {
  section: ResolvedHomepageSection;
}

const DEFAULT_SUBTITLE =
  "Fresh releases and just-landed gear from the brands you trust.";

export default function HomepageProductGridSection({
  section,
}: HomepageProductGridSectionProps) {
  const products = section.products ?? [];
  const titleId = `${section.sectionId}-title`;
  const eyebrow = section.accentLabel ?? "New arrivals";

  return (
    <section
      aria-labelledby={titleId}
      className="new-arrivals-section"
      id={section.sectionId}
    >
      <div className="new-arrivals-section__inner">
        <header className="new-arrivals-section__header">
          <div className="new-arrivals-section__header-copy">
            <p className="new-arrivals-section__eyebrow">{eyebrow}</p>
            <h2 id={titleId}>{section.title}</h2>
            <p className="new-arrivals-section__subtitle">
              {section.subtitle ?? DEFAULT_SUBTITLE}
            </p>
          </div>
          {section.ctaText && section.ctaLink ? (
            <Link
              className="homepage-section__cta-btn new-arrivals-section__cta"
              href={resolveLinkHref(section.ctaLink)}
            >
              {section.ctaText}
              {SECTION_CTA_ARROW}
            </Link>
          ) : null}
        </header>

        <div className="new-arrivals-grid" role="list">
          {products.map((item, index) => (
            <Reveal
              key={item.id}
              className="new-arrivals-grid__cell"
              delay={index * 70}
            >
              <NewArrivalsProductCard
                badgeLabel={item.badgeLabel}
                brand={item.brand}
                featured={index === 0 && Boolean(item.rank)}
                href={item.href}
                id={item.id}
                image={item.image}
                imageAlt={item.imageAlt}
                name={item.name}
                price={item.price}
                rank={item.rank}
                rating={item.rating}
                reviewCount={item.reviewCount}
                salePrice={item.salePrice}
                sectionKey={section.key}
              />
            </Reveal>
          ))}
        </div>

        {section.ctaText && section.ctaLink ? (
          <div className="new-arrivals-section__cta-mobile">
            <Link
              className="homepage-section__cta-btn"
              href={resolveLinkHref(section.ctaLink)}
            >
              {section.ctaText}
              {SECTION_CTA_ARROW}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
