import Link from "next/link";
import ProductShareButton from "@/components/product/ProductShareButton";
import HomepageProductImage from "@/components/homepage/HomepageProductImage";
import { ROUTES } from "@/lib/routes";
import { getShopTheHighlightsPublicData } from "@/lib/server/homepage/homepageService";
import type { HomepageProductItem } from "@/types/homepage";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import Reveal from "@/components/layout/Reveal";

const HEADLINE_ID = "top-products-title";

export function TopProductCard({
  product,
  actionLabel = "View product",
}: {
  product: HomepageProductItem;
  actionLabel?: string;
}) {
  return (
    <article className="blog-teaser__card">
      <ProductShareButton overlay position="top-left" title={product.name} url={product.href} />
      <Link className="blog-teaser__link" href={product.href}>
        <div className="blog-teaser__media">
          {product.image ? (
            <HomepageProductImage
              className="blog-teaser__image"
              fallbackSrc={product.imageFallback}
              height={360}
              sizes="(max-width: 767px) 92vw, 360px"
              src={product.image}
              width={480}
            />
          ) : (
            <div className="blog-teaser__image blog-teaser__image--placeholder" />
          )}
          {product.badgeLabel ? (
            <div aria-label="Product highlight" className="blog-teaser__tags">
              <span className="blog-teaser__tag blog-teaser__tag--primary">
                {product.badgeLabel}
              </span>
            </div>
          ) : null}
        </div>
        <div className="blog-teaser__body">
          <h3 className="blog-teaser__post-title">{product.name}</h3>
          {product.offerText ? <p className="blog-teaser__excerpt">{product.offerText}</p> : null}
          <div className="blog-teaser__footer">
            <p className="blog-teaser__meta">{product.brand}</p>
            <span className="blog-teaser__read">
              {actionLabel}
              {SECTION_CTA_ARROW}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default async function HomepageTopProducts() {
  const section = await getShopTheHighlightsPublicData();

  if (!section?.isActive) {
    return null;
  }

  const ctaLink = section.ctaLink || ROUTES.search;
  const ctaText = section.ctaText || "View all products";

  return (
    <Reveal
      as="section"
      className="blog-teaser"
      aria-labelledby={HEADLINE_ID}
      id="shop-the-highlights"
    >
      <div className="blog-teaser__inner">
        <header className="blog-teaser__header">
          <div className="blog-teaser__header-copy">
            <p className="blog-teaser__eyebrow">
              {section.accentLabel || "TOP PRODUCTS AT VIBE MUSIC"}
            </p>
            <h2 className="blog-teaser__title" id={HEADLINE_ID}>
              {section.title}
            </h2>
            {section.subtitle ? <p className="blog-teaser__subtitle">{section.subtitle}</p> : null}
          </div>
          <Link className="homepage-section__cta-btn blog-teaser__all" href={ctaLink}>
            {ctaText}
            {SECTION_CTA_ARROW}
          </Link>
        </header>

        {section.products.length === 0 ? (
          <p className="blog-teaser__subtitle">
            Featured products will appear here once configured in the admin panel.{" "}
            <Link href={ctaLink}>{ctaText}</Link>.
          </p>
        ) : (
          <div className="blog-teaser__grid blog-teaser__grid--three">
            {section.products.map((product, index) => (
              <Reveal key={product.id} className="blog-teaser__card-wrap" delay={index * 80}>
                <TopProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
