import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import DynamicProductCard from "@/components/homepage/DynamicProductCard";
import type { ResolvedHomepageSection } from "@/types/homepage";

interface HomepageProductGridSectionProps {
  section: ResolvedHomepageSection;
}

export default function HomepageProductGridSection({
  section,
}: HomepageProductGridSectionProps) {
  const products = section.products ?? [];

  return (
    <section id={section.sectionId} className="topnew-products">
      <h2>{section.title}</h2>
      {section.subtitle ? <p className="homepage-section__subtitle">{section.subtitle}</p> : null}
      <div className="topnew-grid">
        {products.map((item) => (
          <DynamicProductCard
            key={item.id}
            item={item}
            sectionKey={section.key}
            showRank
          />
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
