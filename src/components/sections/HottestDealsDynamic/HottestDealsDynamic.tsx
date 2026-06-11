import Link from "next/link";
import { HOTTEST_DEALS_DYNAMIC } from "@/data/hottestDealsDynamic";
import { resolveLinkHref } from "@/lib/routes";
import HottestDealsDynamicCard from "./HottestDealsDynamicCard";

const NAV_PREV_LABEL = "Scroll Previous";
const NAV_NEXT_LABEL = "Scroll Next";

const SECTION_CTA_ARROW = (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    viewBox="0 0 10.5 9"
  >
    <path d="M10.45 4.22a.62.62 0 0 0-.17-.25L6.53.22C6.46.14 6.37.1 6.28.05S6.1 0 6 0s-.19.02-.28.05-.18.1-.25.17a.72.72 0 0 0-.22.53.7.7 0 0 0 .22.53l2.46 2.47H.75a.75.75 0 0 0-.7.46.75.75 0 0 0 0 .58.73.73 0 0 0 .7.46h7.18L5.47 7.72l-.1.11-.07.14-.04.14-.01.14.01.14.04.14.07.14c.02.04.06.08.1.1A.69.69 0 0 0 6 9c.1.01.19 0 .28-.04s.18-.1.25-.17l3.75-3.75a.72.72 0 0 0 .22-.53.8.8 0 0 0-.05-.28z" />
  </svg>
);

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

/** Homepage deal carousel (`#hottest-deals` in main-tail). */
export default function HottestDealsDynamic() {
  const { sectionId, heading, ctaHref, ctaLabel, minRequired, items } =
    HOTTEST_DEALS_DYNAMIC;

  if (items.length < minRequired) {
    return null;
  }

  return (
    <section id={sectionId} className="suggested-products list-view">
      <div className="hottest-deals product-suggest__stage">
        <h2>{heading}</h2>
        <ProductSuggestNav />
        <div className="product-suggest__items paged scrollbar-minimal">
          {items.map((item) => (
            <HottestDealsDynamicCard key={item.id} item={item} />
          ))}
          <div className="product-suggest__end-spacer"></div>
        </div>
        <ProductSuggestNav next />
      </div>
      <Link
        href={resolveLinkHref(ctaHref)}
        className="homepage-btn__section-cta red"
      >
        {ctaLabel}
        {SECTION_CTA_ARROW}
      </Link>
    </section>
  );
}
