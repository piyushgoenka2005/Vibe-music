import CarouselProductCard from "@/components/homepage/CarouselProductCard";
import type { ResolvedHomepageSection } from "@/types/homepage";

const NAV_PREV_LABEL = "Scroll Previous";
const NAV_NEXT_LABEL = "Scroll Next";

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
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
        <g fill="none" strokeLinecap="round" strokeWidth="2">
          {next ? (
            <path d="M17.762 27.505l7.739-7.739-7.739-7.739" />
          ) : (
            <path d="M22.238 12.495l-7.739 7.739 7.739 7.739" />
          )}
        </g>
      </svg>
      {next ? NAV_NEXT_LABEL : NAV_PREV_LABEL}
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

  return (
    <section id={section.sectionId} className="suggested-products list-view">
      <div className="product-suggest__stage">
        <h2>{section.title}</h2>
        {section.subtitle ? (
          <p className="homepage-section__subtitle">{section.subtitle}</p>
        ) : null}
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
