import Image from "next/image";
import Link from "next/link";
import Marquee from "@/components/common/Marquee";
import { resolveLinkHref } from "@/lib/routes";
import type { HomepageBrandItem, ResolvedHomepageSection } from "@/types/homepage";

interface HomepageBrandStripSectionProps {
  section: ResolvedHomepageSection;
}

function BrandStripLink({ brand }: { brand: HomepageBrandItem }) {
  return (
    <Link
      className="homepage-brand-strip__item"
      data-hp-section="brand-strip"
      href={resolveLinkHref(brand.href)}
    >
      {brand.logoUrl ? (
        <Image
          alt={brand.name}
          className="homepage-brand-strip__logo"
          height={40}
          loading="lazy"
          sizes="(max-width: 767px) 120px, 148px"
          src={brand.logoUrl}
          width={120}
        />
      ) : (
        <span className="homepage-brand-strip__wordmark">{brand.name}</span>
      )}
    </Link>
  );
}

export default function HomepageBrandStripSection({
  section,
}: HomepageBrandStripSectionProps) {
  const brands = section.brands ?? [];
  const titleId = `${section.sectionId}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="homepage-brand-strip"
      id={section.sectionId}
    >
      <div className="homepage-brand-strip__inner">
        <header className="homepage-brand-strip__header">
          <h2 id={titleId}>{section.title}</h2>
          {section.subtitle ? (
            <p className="homepage-brand-strip__subtitle">{section.subtitle}</p>
          ) : null}
        </header>
      </div>

      {brands.length > 0 ? (
        <Marquee
          ariaLabel="Brand logos"
          className="homepage-brand-strip__marquee"
          duration="48s"
          role="region"
          sequenceClassName="homepage-brand-strip__sequence"
          trackClassName="homepage-brand-strip__marquee-track"
        >
          {brands.map((brand) => (
            <BrandStripLink key={brand.id} brand={brand} />
          ))}
        </Marquee>
      ) : null}
    </section>
  );
}
