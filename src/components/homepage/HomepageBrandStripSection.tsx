import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import type { ResolvedHomepageSection } from "@/types/homepage";

interface HomepageBrandStripSectionProps {
  section: ResolvedHomepageSection;
}

export default function HomepageBrandStripSection({
  section,
}: HomepageBrandStripSectionProps) {
  const brands = section.brands ?? [];

  return (
    <section id={section.sectionId} className="homepage-brand-strip">
      <h2>{section.title}</h2>
      {section.subtitle ? <p className="homepage-section__subtitle">{section.subtitle}</p> : null}
      <div className="homepage-brand-strip__track scrollbar-minimal">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={resolveLinkHref(brand.href)}
            className="homepage-brand-strip__item"
            data-hp-section="brand-strip"
          >
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} loading="lazy" />
            ) : (
              <span className="homepage-brand-strip__label">{brand.name}</span>
            )}
          </Link>
        ))}
      </div>
      {section.ctaText && section.ctaLink ? (
        <Link
          href={resolveLinkHref(section.ctaLink)}
          className="homepage-btn__section-cta blue"
        >
          {section.ctaText}
          {SECTION_CTA_ARROW}
        </Link>
      ) : null}
    </section>
  );
}
