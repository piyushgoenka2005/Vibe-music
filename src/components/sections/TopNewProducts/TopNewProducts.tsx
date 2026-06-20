import Link from "next/link";
import { TOP_NEW_PRODUCTS } from "@/data/topNewProducts";
import type { TopNewProductItem } from "@/data/topNewProducts";
import { resolveLinkHref } from "@/lib/routes";
import TopNewProductCard from "./TopNewProductCard";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";

function ProductSequence({
  items,
  ariaHidden = false,
}: {
  items: TopNewProductItem[];
  ariaHidden?: boolean;
}) {
  return (
    <>
      {items.map((item) => (
        <TopNewProductCard
          key={ariaHidden ? `${item.id}-clone` : item.id}
          ariaHidden={ariaHidden}
          item={item}
        />
      ))}
    </>
  );
}

/** Homepage ranked new gear marquee (`#top-new-products`). */
export default function TopNewProducts() {
  const { sectionId, heading, ctaHref, ctaLabel, items } = TOP_NEW_PRODUCTS;
  const titleId = `${sectionId}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="new-arrivals-section"
      id={sectionId}
    >
      <div className="new-arrivals-section__inner">
        <header className="new-arrivals-section__header">
          <div className="new-arrivals-section__header-copy">
            <p className="new-arrivals-section__eyebrow">New arrivals</p>
            <h2 id={titleId}>{heading}</h2>
            <p className="new-arrivals-section__subtitle">
              Pre-orders and just-announced gear from top manufacturers.
            </p>
          </div>
          <Link
            className="homepage-section__cta-btn new-arrivals-section__cta"
            href={resolveLinkHref(ctaHref)}
          >
            {ctaLabel}
            {SECTION_CTA_ARROW}
          </Link>
        </header>
      </div>

      <div
        aria-label="Top new products"
        className="new-arrivals-marquee"
        role="region"
      >
        <div className="new-arrivals-marquee__track">
          <div className="new-arrivals-marquee__sequence" role="list">
            <ProductSequence items={items} />
          </div>
          <div
            aria-hidden="true"
            className="new-arrivals-marquee__sequence new-arrivals-marquee__sequence--clone"
          >
            <ProductSequence ariaHidden items={items} />
          </div>
        </div>
      </div>

      <div className="new-arrivals-section__inner">
        <div className="new-arrivals-section__cta-mobile">
          <Link
            className="homepage-section__cta-btn"
            href={resolveLinkHref(ctaHref)}
          >
            {ctaLabel}
            {SECTION_CTA_ARROW}
          </Link>
        </div>
      </div>
    </section>
  );
}
