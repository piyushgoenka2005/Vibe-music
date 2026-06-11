import { SUGGESTED_PRODUCTS } from "@/data/suggestedProducts";
import SuggestedProductCard from "./SuggestedProductCard";

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

/** Homepage suggested products carousel (`#suggested-products`). */
export default function SuggestedProducts() {
  const { sectionId, heading, items } = SUGGESTED_PRODUCTS;

  return (
    <section
      id={sectionId}
      className="suggested-products list-view"
    >
      <div className="product-suggest__stage">
        <h2>{heading}</h2>
        <ProductSuggestNav />
        <div className="product-suggest__items paged scrollbar-minimal">
          {items.map((item) => (
            <SuggestedProductCard key={item.id} item={item} />
          ))}
          <div className="product-suggest__end-spacer"></div>
        </div>
        <ProductSuggestNav next />
      </div>
    </section>
  );
}
