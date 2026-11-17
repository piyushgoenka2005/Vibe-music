import Link from "next/link";
import { HOMEPAGE_TRENDING_CTA } from "@/data/homepageTrendingProducts";
import { resolveLinkHref } from "@/lib/routes";
import { getTrendingBuysPublicData } from "@/lib/server/homepage/homepageService";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import Reveal from "@/components/layout/Reveal";
import { TopProductCard } from "@/components/home/HomepageTopProducts";

const HEADLINE_ID = "trending-buys-title";

export default async function HomepageBlogTeaser() {
  const section = await getTrendingBuysPublicData();

  if (!section.isActive) {
    return null;
  }

  const products = section.products;
  const gridModifier = products.length === 1 ? "one" : products.length === 2 ? "two" : "three";
  const ctaHref = section.ctaLink ? resolveLinkHref(section.ctaLink) : HOMEPAGE_TRENDING_CTA;

  return (
    <Reveal
      as="section"
      className="blog-teaser"
      aria-labelledby={HEADLINE_ID}
      data-section="trending_buys"
      id="trending-buys"
    >
      <div className="blog-teaser__inner">
        <header className="blog-teaser__header">
          <div className="blog-teaser__header-copy">
            {section.eyebrow ? <p className="blog-teaser__eyebrow">{section.eyebrow}</p> : null}
            <h2 className="blog-teaser__title" id={HEADLINE_ID}>
              {section.title}
            </h2>
            {section.subtitle ? <p className="blog-teaser__subtitle">{section.subtitle}</p> : null}
          </div>
          {section.ctaText && section.ctaLink ? (
            <Link className="homepage-section__cta-btn blog-teaser__all" href={ctaHref}>
              {section.ctaText}
              {SECTION_CTA_ARROW}
            </Link>
          ) : null}
        </header>

        {products.length === 0 ? (
          <p className="blog-teaser__subtitle">
            Trending products will appear here once configured in the admin panel.{" "}
            <Link href={ctaHref}>{section.ctaText || "Browse the shop"}</Link>.
          </p>
        ) : (
          <div className={`blog-teaser__grid blog-teaser__grid--${gridModifier}`}>
            {products.map((product, index) => (
              <Reveal key={product.id} className="blog-teaser__card-wrap" delay={index * 80}>
                <TopProductCard actionLabel={section.cardActionLabel} product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
