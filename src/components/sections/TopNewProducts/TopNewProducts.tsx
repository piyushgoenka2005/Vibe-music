import Link from "next/link";
import { TOP_NEW_PRODUCTS } from "@/data/topNewProducts";
import { resolveLinkHref } from "@/lib/routes";
import TopNewProductCard from "./TopNewProductCard";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import Reveal from "@/components/layout/Reveal";

/** Homepage ranked new gear grid (`#top-new-products`). */
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

        <div className="new-arrivals-grid" role="list">
          {items.map((item, index) => (
            <Reveal
              key={item.id}
              className="new-arrivals-grid__cell"
              delay={index * 70}
            >
              <TopNewProductCard featured={index === 0} item={item} />
            </Reveal>
          ))}
        </div>

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
