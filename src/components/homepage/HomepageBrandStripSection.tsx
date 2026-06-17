import Link from "next/link";
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
        <img
          alt={brand.name}
          className="homepage-brand-strip__logo"
          height={40}
          loading="lazy"
          src={brand.logoUrl}
          width={120}
        />
      ) : (
        <span className="homepage-brand-strip__wordmark">{brand.name}</span>
      )}
    </Link>
  );
}

function BrandSequence({ brands }: { brands: HomepageBrandItem[] }) {
  return (
    <>
      {brands.map((brand) => (
        <BrandStripLink key={brand.id} brand={brand} />
      ))}
    </>
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
        <div
          aria-label="Brand logos"
          className="homepage-brand-strip__marquee"
          role="region"
        >
          <div className="homepage-brand-strip__marquee-track">
            <div className="homepage-brand-strip__sequence">
              <BrandSequence brands={brands} />
            </div>
            <div
              aria-hidden="true"
              className="homepage-brand-strip__sequence homepage-brand-strip__sequence--clone"
            >
              <BrandSequence brands={brands} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
