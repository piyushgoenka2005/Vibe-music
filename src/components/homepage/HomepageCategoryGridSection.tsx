import Image from "next/image";
import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import HomepageSectionHeader from "@/components/homepage/HomepageSectionHeader";
import type { ResolvedHomepageSection } from "@/types/homepage";

interface HomepageCategoryGridSectionProps {
  section: ResolvedHomepageSection;
}

export default function HomepageCategoryGridSection({
  section,
}: HomepageCategoryGridSectionProps) {
  const categories = section.categories ?? [];
  const titleId = `${section.sectionId}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="popular-categories"
      id={section.sectionId}
    >
      <div className="popular-categories__inner">
        <HomepageSectionHeader
          ctaLink={section.ctaLink}
          ctaText={section.ctaText}
          subtitle={section.subtitle}
          title={section.title}
          titleId={titleId}
        />

        <div className="popcat-grid" role="list">
          {categories.map((item, index) => (
            <Link
              key={item.id}
              className="popcat-item"
              data-hp-section="categories"
              data-hp-slot={index + 1}
              href={resolveLinkHref(item.href)}
              role="listitem"
            >
              {item.badge ? (
                <span className="popcat-badge">{item.badge}</span>
              ) : null}
              <div className="popcat-image">
                <Image
                  alt=""
                  height={120}
                  loading="lazy"
                  src={item.imageSrc.split("?")[0]}
                  width={120}
                  sizes="120px"
                />
              </div>
              <div className="popcat-name">
                <h3>{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
