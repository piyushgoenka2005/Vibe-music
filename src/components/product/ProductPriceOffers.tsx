"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildPdpOfferRows,
  resolvePdpPricing,
} from "@/lib/product/pdpOffers";
import type { ProductDetail, ProductVariant } from "@/types/product";
import {
  formatCurrencyPrecise,
  isPurchasablePrice,
} from "@/utils/currency";
import { BadgePercent, ChevronRight } from "lucide-react";

interface ProductPriceOffersProps {
  product: ProductDetail;
  selectedVariant: ProductVariant;
}

const OFFER_CARD_SCROLL = 168;

export default function ProductPriceOffers({
  product,
  selectedVariant,
}: ProductPriceOffersProps) {
  const [canScrollNext, setCanScrollNext] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const displayPrice = selectedVariant.price;
  const pricing = useMemo(
    () =>
      resolvePdpPricing(
        displayPrice,
        product.msrp,
        product.originalPrice
      ),
    [displayPrice, product.msrp, product.originalPrice]
  );

  const offers = useMemo(
    () => buildPdpOfferRows(displayPrice),
    [displayPrice]
  );

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track) return;

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    return () => observer.disconnect();
  }, [offers.length, updateScrollState]);

  const scrollNext = () => {
    trackRef.current?.scrollBy({ left: OFFER_CARD_SCROLL, behavior: "smooth" });
  };

  if (!isPurchasablePrice(displayPrice)) {
    return (
      <section className="pdp-info-pricing" aria-label="Pricing">
        <p className="pdp-info-pricing__coming-soon">Coming Soon</p>
      </section>
    );
  }

  return (
    <section className="pdp-info-pricing" aria-label="Pricing and offers">
      <div className="pdp-info-pricing__headline">
        <span className="pdp-info-pricing__price">
          {formatCurrencyPrecise(pricing.displayPrice)}
        </span>
        {pricing.hasDiscount ? (
          <span className="pdp-info-pricing__pct-badge">
            − {pricing.savingsPercent}%
          </span>
        ) : null}
      </div>

      {pricing.hasDiscount && pricing.mrp != null ? (
        <p className="pdp-info-pricing__mrp">
          <span className="pdp-info-pricing__mrp-label">M.R.P.:</span>{" "}
          <span className="pdp-info-pricing__mrp-value">
            {formatCurrencyPrecise(pricing.mrp)}
          </span>
        </p>
      ) : null}

      <p className="pdp-info-pricing__tax">Inclusive of all taxes</p>

      {offers.length > 0 ? (
        <div className="pdp-offers">
          <div className="pdp-offers__header">
            <BadgePercent size={18} aria-hidden className="pdp-offers__header-icon" />
            <h3 className="pdp-offers__title">Offers</h3>
          </div>

          <div className="pdp-offers__carousel-wrap">
            <div
              ref={trackRef}
              className="pdp-offers__track"
              onScroll={updateScrollState}
              role="list"
              aria-label="Available offers"
            >
              {offers.map((offer) => (
                <article
                  key={offer.id}
                  className="pdp-offers__card"
                  role="listitem"
                >
                  <h4 className="pdp-offers__card-title">{offer.title}</h4>
                  <p className="pdp-offers__card-detail">{offer.detail}</p>
                  <button type="button" className="pdp-offers__card-link">
                    {offer.offerCount}{" "}
                    {offer.offerCount === 1 ? "offer" : "offers"}
                    <ChevronRight size={14} aria-hidden />
                  </button>
                </article>
              ))}
            </div>

            {canScrollNext ? (
              <button
                type="button"
                className="pdp-offers__nav"
                onClick={scrollNext}
                aria-label="Scroll offers right"
              >
                <ChevronRight size={18} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
