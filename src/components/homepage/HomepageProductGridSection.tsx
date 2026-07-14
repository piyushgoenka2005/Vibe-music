import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import NewArrivalsProductCard from "@/components/homepage/NewArrivalsProductCard";
import { isHomepageProductVisible } from "@/lib/homepage/productVisibility";
import type {
  HomepageProductItem,
  ResolvedHomepageSection,
} from "@/types/homepage";

interface HomepageProductGridSectionProps {
  section: ResolvedHomepageSection;
}

const DEFAULT_SUBTITLE =
  "Fresh releases and just-landed gear from the brands you trust.";

function ProductSequence({
  products,
  sectionKey,
  ariaHidden = false,
}: {
  products: HomepageProductItem[];
  sectionKey: string;
  ariaHidden?: boolean;
}) {
  return (
    <>
      {products.map((item, index) => (
        <NewArrivalsProductCard
          key={ariaHidden ? `${item.id}-clone` : item.id}
          ariaHidden={ariaHidden}
          badgeLabel={item.badgeLabel}
          brand={item.brand}
          href={item.href}
          id={item.id}
          image={item.image}
          imageAlt={item.imageAlt}
          imagePriority={false}
          name={item.name}
          price={item.price}
          rank={item.rank}
          rating={item.rating}
          reviewCount={item.reviewCount}
          salePrice={item.salePrice}
          sectionKey={sectionKey}
        />
      ))}
    </>
  );
}

export default function HomepageProductGridSection({
  section,
}: HomepageProductGridSectionProps) {
  const products = (section.products ?? []).filter(isHomepageProductVisible);
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
      </div>

      {products.length > 0 ? (
        <div
          aria-label={section.title}
          className="new-arrivals-marquee"
          role="region"
        >
          <div className="new-arrivals-marquee__track">
            <div className="new-arrivals-marquee__sequence" role="list">
              <ProductSequence
                products={products}
                sectionKey={section.key}
              />
            </div>
            <div
              aria-hidden="true"
              className="new-arrivals-marquee__sequence new-arrivals-marquee__sequence--clone"
            >
              <ProductSequence
                ariaHidden
                products={products}
                sectionKey={section.key}
              />
            </div>
          </div>
        </div>
      ) : null}

      {section.ctaText && section.ctaLink ? (
        <div className="new-arrivals-section__inner">
          <div className="new-arrivals-section__cta-mobile">
            <Link
              className="homepage-section__cta-btn"
              href={resolveLinkHref(section.ctaLink)}
            >
              {section.ctaText}
              {SECTION_CTA_ARROW}
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
