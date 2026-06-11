import Link from "next/link";
import { SUGGESTED_GX_PRODUCTS } from "@/data/suggestedGXProducts";
import { resolveLinkHref } from "@/lib/routes";
import SuggestedGXProductCard from "./SuggestedGXProductCard";

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

/** Homepage Gear Exchange product carousel (`#suggested-gx-products`). */
export default function SuggestedGXProducts() {
  const {
    sectionId,
    heading,
    subtextHtml,
    gearExchangeHref,
    overlayImageSrc,
    overlayImageAlt,
    items,
  } = SUGGESTED_GX_PRODUCTS;

  return (
    <section id={sectionId} className="suggested-gx-products list-view">
      <div className="gx product-suggest__stage">
        <h2>{heading}</h2>
        <p className="gx-subtext">
          {subtextHtml} Shop the{" "}
          <Link href={resolveLinkHref(gearExchangeHref)}>Gear Exchange</Link>.
        </p>
        <div className="product-suggest__overlay">
          <img src={overlayImageSrc} alt={overlayImageAlt} />
        </div>
        <ProductSuggestNav />
        <div className="product-suggest__items paged scrollbar-minimal">
          {items.map((item) => (
            <SuggestedGXProductCard key={item.id} item={item} />
          ))}
        </div>
        <ProductSuggestNav next />
      </div>
    </section>
  );
}
