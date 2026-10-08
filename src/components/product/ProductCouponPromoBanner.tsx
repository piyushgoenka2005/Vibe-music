"use client";

import { buildProductCouponCopy } from "@/lib/product/productCouponDisplay";
import type { StorefrontCouponOffer } from "@/types/coupon";

interface ProductCouponPromoBannerProps {
  coupon: StorefrontCouponOffer;
  variant?: "pricing" | "buybox";
  selected?: boolean;
  onSelect?: () => void;
}

export default function ProductCouponPromoBanner({
  coupon,
  variant = "pricing",
  selected = false,
  onSelect,
}: ProductCouponPromoBannerProps) {
  const copy = buildProductCouponCopy(coupon);

  if (variant === "buybox") {
    return (
      <div className="pdp-buybox-coupon" role="status">
        <p className="pdp-buybox-coupon__headline">{copy.headline}</p>
        <p className="pdp-buybox-coupon__code">
          Use Code: <strong>{copy.code}</strong>
        </p>
        {copy.termsLine ? <p className="pdp-buybox-coupon__terms">{copy.termsLine}</p> : null}
        {copy.buyBoxFooter ? (
          <p className="pdp-buybox-coupon__footer">{copy.buyBoxFooter}</p>
        ) : null}
        {onSelect ? (
          <button
            type="button"
            className="pdp-buybox-coupon__apply"
            onClick={onSelect}
            disabled={selected}
          >
            {selected ? "Coupon applied" : "Apply coupon"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pdp-coupon-promo pdp-coupon-promo--pricing" role="status">
      <p className="pdp-coupon-promo__code">{copy.code}</p>
      <p className="pdp-coupon-promo__offer">{copy.offerLine}</p>
      {copy.maxDiscountLine ? (
        <p className="pdp-coupon-promo__max">{copy.maxDiscountLine}</p>
      ) : null}
      {copy.disclaimer ? <p className="pdp-coupon-promo__disclaimer">{copy.disclaimer}</p> : null}
      {onSelect ? (
        <button
          type="button"
          className="pdp-coupon-promo__cta"
          onClick={onSelect}
          disabled={selected}
        >
          {selected ? "Applied" : "Apply at checkout"}
        </button>
      ) : null}
    </div>
  );
}
