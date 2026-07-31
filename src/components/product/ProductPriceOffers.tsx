"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buildPdpOfferRows,
  resolvePdpPricing,
} from "@/lib/product/pdpOffers";
import { buildPdpOfferRowsFromCoupons } from "@/lib/product/pdpOffersFromCoupons";
import type { StorefrontCouponOffer } from "@/types/coupon";
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

export default function ProductPriceOffers({
  product,
  selectedVariant,
}: ProductPriceOffersProps) {
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

  const offersQuery = useQuery({
    queryKey: ["storefront-active-coupons"],
    queryFn: async () => {
      const res = await fetch("/api/coupons/active");
      if (!res.ok) throw new Error("Failed to load offers");
      const data = (await res.json()) as { coupons: StorefrontCouponOffer[] };
      return data.coupons ?? [];
    },
    staleTime: 120_000,
  });

  const offers = useMemo(() => {
    const fromCoupons = buildPdpOfferRowsFromCoupons(offersQuery.data ?? []);
    if (fromCoupons.length > 0) return fromCoupons;
    return buildPdpOfferRows(displayPrice);
  }, [offersQuery.data, displayPrice]);

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
            - {pricing.savingsPercent}%
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

      {offersQuery.isError ? (
        <p className="pdp-info-pricing__tax" role="status">
          Offers unavailable right now — try again later or apply a coupon at checkout.
        </p>
      ) : null}

      {offers.length > 0 ? (
        <div className="pdp-offers">
          <div className="pdp-offers__header">
            <BadgePercent size={18} aria-hidden className="pdp-offers__header-icon" />
            <h3 className="pdp-offers__title">Offers</h3>
          </div>

          <div className="pdp-offers__carousel-wrap">
            <div
              className="pdp-offers__track"
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
                  <span className="pdp-offers__card-link" aria-hidden="true">
                    {offer.offerCount}{" "}
                    {offer.offerCount === 1 ? "offer" : "offers"}
                    <ChevronRight size={14} aria-hidden />
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
