import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import type { ResolvedHomepageSection } from "@/types/homepage";

interface HomepageCategoryGridSectionProps {
  section: ResolvedHomepageSection;
}

export default function HomepageCategoryGridSection({
  section,
}: HomepageCategoryGridSectionProps) {
  const categories = section.categories ?? [];

  return (
    <section id={section.sectionId} className="popular-categories">
      <h2>{section.title}</h2>
      {section.subtitle ? <p className="homepage-section__subtitle">{section.subtitle}</p> : null}
      <div className="popcat-grid">
        {categories.map((item, index) => (
          <Link
            key={item.id}
            href={resolveLinkHref(item.href)}
            className="popcat-item"
            data-hp-section="categories"
            data-hp-slot={index + 1}
          >
            {item.badge ? (
              <div className="popcat-badge tile-label bg-red text-white text-xxs">
                {item.badge}
              </div>
            ) : null}
            <picture className="popcat-image">
              {item.imageSrc ? (
                <img width={101} height={101} src={item.imageSrc} alt={item.title} />
              ) : null}
            </picture>
            <div className="popcat-name">
              <h3>{item.title}</h3>
            </div>
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
