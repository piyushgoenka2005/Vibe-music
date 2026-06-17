import CarouselProductCard from "@/components/homepage/CarouselProductCard";
import type { HomepageSectionKey, ResolvedHomepageSection } from "@/types/homepage";

const NAV_PREV_LABEL = "Scroll Previous";
const NAV_NEXT_LABEL = "Scroll Next";

const CAROUSEL_EYEBROWS: Partial<Record<HomepageSectionKey, string>> = {
  trending: "Hot right now",
  best_sellers: "Customer favorites",
  staff_picks: "Curated by us",
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
  const products = section.products ?? [];
  const isPremium = PREMIUM_CAROUSEL_KEYS.has(section.key);
  const titleId = `${section.sectionId}-title`;
  const eyebrow = CAROUSEL_EYEBROWS[section.key] ?? section.accentLabel;

  return (
    <section
      id={section.sectionId}
      className={`suggested-products list-view${isPremium ? " premium-product-carousel" : ""}`}
      aria-labelledby={isPremium ? titleId : undefined}
    >
      <div className="product-suggest__stage">
        {isPremium ? (
          <header className="premium-product-carousel__header">
            {eyebrow ? (
              <p className="premium-product-carousel__eyebrow">{eyebrow}</p>
            ) : null}
            <h2 id={titleId}>{section.title}</h2>
            {section.subtitle ? (
              <p className="premium-product-carousel__subtitle">{section.subtitle}</p>
            ) : null}
          </header>
        ) : (
          <>
            <h2>{section.title}</h2>
            {section.subtitle ? (
              <p className="homepage-section__subtitle">{section.subtitle}</p>
            ) : null}
          </>
        )}
        <ProductSuggestNav />
        <div className="product-suggest__items paged scrollbar-minimal">
          {products.map((item) => (
            <CarouselProductCard key={item.id} item={item} sectionKey={section.key} />
          ))}
          <div className="product-suggest__end-spacer"></div>
        </div>
        <ProductSuggestNav next />
      </div>
    </section>
  );
}
