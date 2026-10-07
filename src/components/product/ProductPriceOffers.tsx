"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPdpOfferRows, resolvePdpPricing } from "@/lib/product/pdpOffers";
import { buildPdpOfferRowsFromCoupons } from "@/lib/product/pdpOffersFromCoupons";
import ProductCouponPromoBanner from "@/components/product/ProductCouponPromoBanner";
import type { StorefrontCouponOffer } from "@/types/coupon";
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
  const pendingCouponCode = useCartStore((s) => s.pendingCouponCode);
  const displayPrice = selectedVariant.price;
  const pricing = useMemo(
    () => resolvePdpPricing(displayPrice, product.msrp, product.originalPrice),
    [displayPrice, product.msrp, product.originalPrice],
  );

  const [activeCoupons, setActiveCoupons] = useState<StorefrontCouponOffer[] | null>(null);
  const [offersError, setOffersError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadOffers = async () => {
      try {
        const res = await fetch(`/api/coupons/active?productId=${encodeURIComponent(product.id)}`);
        if (!res.ok) throw new Error("Failed to load offers");
        const payload = (await res.json()) as { coupons: StorefrontCouponOffer[] };
        if (!cancelled) {
          setActiveCoupons(payload.coupons ?? []);
        }
      } catch {
        if (!cancelled) {
          setOffersError(true);
        }
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(() => void loadOffers(), { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(() => void loadOffers(), 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [product.id]);

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

  return (
    <section className="pdp-info-pricing" aria-label="Pricing and offers">
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

      {activeCoupons && activeCoupons.length > 0 ? (
        <ProductCouponPromoBanner
          coupon={activeCoupons[0]}
          selected={
            couponCode === activeCoupons[0].code || pendingCouponCode === activeCoupons[0].code
          }
          onSelect={() => void applyCoupon(activeCoupons[0].code)}
        />
      ) : null}

      {offersError ? (
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
            <div className="pdp-offers__track" role="list" aria-label="Available offers">
              {offers.map((offer) => {
                const code = offer.id;
                const selected = couponCode === code || pendingCouponCode === code;
                const couponMeta = activeCoupons?.find((entry) => entry.code === code);
                return (
                  <button
                    key={offer.id}
                    type="button"
                    className="pdp-offers__card"
                    role="listitem"
                    disabled={selected}
                    onClick={() => void applyCoupon(code)}
                    style={{
                      cursor: selected ? "default" : "pointer",
                      textAlign: "left",
                      border: selected ? "2px solid var(--accent, #2563eb)" : undefined,
                    }}
                  >
                    <h4 className="pdp-offers__card-title">{offer.title}</h4>
                    <p className="pdp-offers__card-detail">{offer.detail}</p>
                    <span className="pdp-offers__card-link">
                      {selected
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
        </div>
      ) : null}
    </section>
  );
}
