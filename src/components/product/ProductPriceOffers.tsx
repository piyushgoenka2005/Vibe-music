"use client";

import { useMemo } from "react";
import { buildPdpOfferRows, resolvePdpPricing } from "@/lib/product/pdpOffers";
import { buildPdpOfferRowsFromCoupons } from "@/lib/product/pdpOffersFromCoupons";
import { useAppliedCouponSync } from "@/hooks/useAppliedCouponSync";
import { useProductActiveCoupons } from "@/hooks/useProductActiveCoupons";
import type { ProductDetail, ProductVariant } from "@/types/product";
import { formatCurrencyPrecise, isPurchasablePrice } from "@/utils/currency";
import { BadgePercent, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatCouponLabel } from "@/lib/coupons/formatCouponLabel";

interface ProductPriceOffersProps {
  product: ProductDetail;
  selectedVariant: ProductVariant;
}

export default function ProductPriceOffers({ product, selectedVariant }: ProductPriceOffersProps) {
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const couponCode = useCartStore((s) => s.couponCode);
  const couponInvalidReason = useCartStore((s) => s.couponInvalidReason);
  const pendingCouponCode = useCartStore((s) => s.pendingCouponCode);
  const displayPrice = selectedVariant.price;
  const couponLines = useMemo(
    () => [{ productId: product.id, quantity: 1, price: displayPrice }],
    [product.id, displayPrice],
  );
  const pricing = useMemo(
    () => resolvePdpPricing(displayPrice, product.msrp, product.originalPrice),
    [displayPrice, product.msrp, product.originalPrice],
  );

  const {
    coupons: activeCoupons,
    isLoading: offersLoading,
    error: offersError,
  } = useProductActiveCoupons(product.id);

  useAppliedCouponSync({
    lineItems: couponLines,
    activeCoupons,
    isLoadingActiveCoupons: offersLoading,
    isActiveCouponsError: offersError,
  });

  const offers = useMemo(() => {
    const fromCoupons = buildPdpOfferRowsFromCoupons(activeCoupons ?? []);
    if (fromCoupons.length > 0) return fromCoupons;
    return buildPdpOfferRows(displayPrice);
  }, [activeCoupons, displayPrice]);

  if (!isPurchasablePrice(displayPrice)) {
    return (
      <section className="pdp-info-pricing" aria-label="Pricing">
        <p className="pdp-info-pricing__coming-soon">Coming Soon</p>
      </section>
    );
  }

  const showOffersPanel = offersLoading || offers.length > 0;

  return (
    <section className="pdp-info-pricing" aria-label="Pricing and offers">
      <div className="pdp-info-pricing__layout">
        <div className="pdp-info-pricing__price-col">
          <div className="pdp-info-pricing__headline">
            <span className="pdp-info-pricing__price">
              <span className="pdp-info-pricing__rupee" aria-hidden="true">
                ₹
              </span>
              <span className="pdp-info-pricing__price-amount">
                {formatCurrencyPrecise(pricing.displayPrice).replace(/^[^\d]*/, "")}
              </span>
            </span>
            {pricing.hasDiscount ? (
              <span className="pdp-info-pricing__pct-badge">- {pricing.savingsPercent}%</span>
            ) : null}
          </div>

          {pricing.hasDiscount && pricing.mrp != null ? (
            <p className="pdp-info-pricing__mrp">
              <span className="pdp-info-pricing__mrp-label">M.R.P.:</span>{" "}
              <span className="pdp-info-pricing__mrp-value">
                <span className="pdp-info-pricing__rupee" aria-hidden="true">
                  ₹
                </span>
                <span className="pdp-info-pricing__mrp-amount">
                  {formatCurrencyPrecise(pricing.mrp).replace(/^[^\d]*/, "")}
                </span>
              </span>
            </p>
          ) : null}

          <p className="pdp-info-pricing__tax">Inclusive of all taxes</p>

          {showOffersPanel ? (
            <p className="pdp-info-pricing__offers-label">
              <BadgePercent size={16} aria-hidden className="pdp-info-pricing__offers-icon" />
              Offers
            </p>
          ) : null}
        </div>

        {showOffersPanel ? (
          <div className="pdp-info-pricing__offers-col">
            <div className="pdp-offers pdp-offers--inline">
              {offersLoading ? (
                <p className="pdp-offers__loading" role="status">
                  Loading offers…
                </p>
              ) : (
                <div className="pdp-offers__carousel-wrap">
                  <div className="pdp-offers__track" role="list" aria-label="Available offers">
                    {offers.map((offer) => {
                      const code = offer.id;
                      const isInvalid = couponCode === code && Boolean(couponInvalidReason);
                      const selected =
                        (couponCode === code && !couponInvalidReason) || pendingCouponCode === code;
                      const couponMeta = activeCoupons?.find((entry) => entry.code === code);
                      return (
                        <button
                          key={offer.id}
                          type="button"
                          className={`pdp-offers__card${selected ? " pdp-offers__card--selected" : ""}${isInvalid ? " pdp-offers__card--invalid" : ""}`}
                          role="listitem"
                          disabled={selected}
                          onClick={() => void applyCoupon(code, { items: couponLines })}
                        >
                          <h4 className="pdp-offers__card-title">{offer.title}</h4>
                          <p className="pdp-offers__card-detail">{offer.detail}</p>
                          <span className="pdp-offers__card-link">
                            {isInvalid
                              ? (couponInvalidReason ?? "Invalid coupon")
                              : selected
                                ? "Selected for checkout"
                                : couponMeta
                                  ? `Use ${formatCouponLabel(couponMeta)}`
                                  : `Use code ${code}`}
                            <ChevronRight size={14} aria-hidden />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {offersError ? (
        <p className="pdp-info-pricing__tax" role="status">
          Offers unavailable right now — try again later or apply a coupon at checkout.
        </p>
      ) : null}
    </section>
  );
}
