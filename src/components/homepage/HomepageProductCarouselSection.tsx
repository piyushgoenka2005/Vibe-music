import Link from "next/link";
import CarouselProductCard from "@/components/homepage/CarouselProductCard";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import { isHomepageProductVisible } from "@/lib/homepage/productVisibility";
import { resolveLinkHref } from "@/lib/routes";
import type { HomepageSectionKey, ResolvedHomepageSection } from "@/types/homepage";

const NAV_PREV_LABEL = "Scroll Previous";
const NAV_NEXT_LABEL = "Scroll Next";

const CAROUSEL_EYEBROWS: Partial<Record<HomepageSectionKey, string>> = {
  trending: "Hot right now",
  best_sellers: "Customer favorites",
  staff_picks: "Curated by us",
};

const SECTION_DEFAULTS: Partial<
  Record<
    HomepageSectionKey,
    { subtitle: string; ctaText: string; ctaLink: string }
  >
> = {
  best_sellers: {
    subtitle: "Top-rated gear musicians keep coming back for.",
    ctaText: "View all best sellers",
    ctaLink: "/search/results?q=best+sellers",
  },
  trending: {
    subtitle: "Popular right now across guitars, PA, and studio gear.",
    ctaText: "Explore trending",
    ctaLink: "/search/results?q=trending",
  },
  staff_picks: {
    subtitle: "Hand-picked by our team for practice rooms, stages, and studios.",
    ctaText: "Shop all products",
    ctaLink: "/search",
  },
};

const PREMIUM_CAROUSEL_KEYS = new Set<HomepageSectionKey>([
  "trending",
  "best_sellers",
  "staff_picks",
]);

function ProductSuggestNav({ next = false }: { next?: boolean }) {
  const className = next
    ? "product-suggest__nav product-suggest__nav--next"
    : "product-suggest__nav";

  return (
    <button
      type="button"
      className={className}
      aria-label={next ? NAV_NEXT_LABEL : NAV_PREV_LABEL}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" aria-hidden>
        <g fill="none" strokeLinecap="round" strokeWidth="2">
          {next ? (
            <path d="M17.762 27.505l7.739-7.739-7.739-7.739" />
          ) : (
            <path d="M22.238 12.495l-7.739 7.739 7.739 7.739" />
          )}
        </g>
      </svg>
    </button>
  );
}

interface HomepageProductCarouselSectionProps {
  section: ResolvedHomepageSection;
}

export default function HomepageProductCarouselSection({
  section,
}: HomepageProductCarouselSectionProps) {
  const products = (section.products ?? []).filter(isHomepageProductVisible);
  const isPremium = PREMIUM_CAROUSEL_KEYS.has(section.key);
  const titleId = `${section.sectionId}-title`;
  const eyebrow = CAROUSEL_EYEBROWS[section.key] ?? section.accentLabel;
  const defaults = SECTION_DEFAULTS[section.key];
  const subtitle = section.subtitle ?? defaults?.subtitle;
  const ctaText = section.ctaText ?? defaults?.ctaText;
  const ctaLink = section.ctaLink ?? defaults?.ctaLink;

  if (products.length === 0) {
    return null;
  }

  return (
    <section
      id={section.sectionId}
      className={`suggested-products list-view${isPremium ? " premium-product-carousel" : ""}`}
      data-section={section.key}
      aria-labelledby={isPremium ? titleId : undefined}
    >
      <div className="product-suggest__stage">
        {isPremium ? (
          <header className="premium-product-carousel__header">
            <div className="premium-product-carousel__header-copy">
              {eyebrow ? (
                <p className="premium-product-carousel__eyebrow">{eyebrow}</p>
              ) : null}
              <h2 id={titleId}>{section.title}</h2>
              {subtitle ? (
                <p className="premium-product-carousel__subtitle">{subtitle}</p>
              ) : null}
            </div>
            {ctaText && ctaLink ? (
              <Link
                className="homepage-section__cta-btn premium-product-carousel__cta"
                href={resolveLinkHref(ctaLink)}
              >
                {ctaText}
                {SECTION_CTA_ARROW}
              </Link>
            ) : null}
          </header>
        ) : (
          <>
            <h2>{section.title}</h2>
            {subtitle ? (
              <p className="homepage-section__subtitle">{subtitle}</p>
            ) : null}
          </>
        )}

        <div className="product-suggest__carousel">
          <ProductSuggestNav />
          <div className="product-suggest__items paged scrollbar-minimal">
            {products.map((item) => (
              <CarouselProductCard key={item.id} item={item} sectionKey={section.key} />
            ))}
            <div className="product-suggest__end-spacer"></div>
          </div>
          <ProductSuggestNav next />
        </div>

        {isPremium && ctaText && ctaLink ? (
          <div className="premium-product-carousel__cta-mobile">
            <Link
              className="homepage-section__cta-btn"
              href={resolveLinkHref(ctaLink)}
            >
              {ctaText}
              {SECTION_CTA_ARROW}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
