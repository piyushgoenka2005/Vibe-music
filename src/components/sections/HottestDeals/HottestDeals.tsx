import Link from "next/link";
import { HOTTEST_DEALS } from "@/data/hottestDeals";
import { resolveLinkHref } from "@/lib/routes";
import DealCard from "./DealCard";

/** First tile-block inside `#sales-events` (Drum Month / Hottest Deals carousel). */
export default function HottestDeals() {
  const { sliderId, accentLabel, heading, ctaHref, ctaLabel, items } =
    HOTTEST_DEALS;

  return (
    <section className="tile-block borderless">
      <div className="section-header">
        <span className="accent-text text-red">{accentLabel}</span>
        <h2 className="bg-gray50 text-black text-center">{heading}</h2>
        <span className="accent bg-red"></span>
      </div>

      <div
        id={sliderId}
        className="tiles tiles--slider flex-container flex-row flex-nowrap scrollbar-minimal horizontal cols-4 product-peak-3"
      >
        {items.map((item) => (
          <DealCard key={item.id} item={item} />
        ))}
      </div>

      <div
        data-prev-id={sliderId}
        className="tile--slider-controls prev bg-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
          <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2">
            <g></g>
            <path d="M22.238 12.495l-7.739 7.739 7.739 7.739" fill="none" />
          </g>
        </svg>
      </div>
      <div
        data-next-id={sliderId}
        className="tile--slider-controls next bg-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
          <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="2">
            <g transform="rotate(180 20 20)"></g>
            <path d="M17.762 27.505l7.739-7.739-7.739-7.739" fill="none" />
          </g>
        </svg>
      </div>

      <div className="section-cta">
        <Link
          href={resolveLinkHref(ctaHref)}
          className="btn btn-default btn-red weight-demi"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
