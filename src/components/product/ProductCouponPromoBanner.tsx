"use client";

import { Tag } from "lucide-react";
import { buildPdpCouponPromoMessage } from "@/lib/product/pdpOffersFromCoupons";
import type { StorefrontCouponOffer } from "@/types/coupon";

interface ProductCouponPromoBannerProps {
  coupon: StorefrontCouponOffer;
  selected?: boolean;
  onSelect: () => void;
}

export default function ProductCouponPromoBanner({
  coupon,
  selected,
  onSelect,
}: ProductCouponPromoBannerProps) {
  const message = buildPdpCouponPromoMessage(coupon);

  return (
    <div className="pdp-coupon-promo" role="status">
      <div className="pdp-coupon-promo__icon" aria-hidden>
        <Tag size={18} strokeWidth={2.25} />
      </div>
      <div className="pdp-coupon-promo__body">
        <p className="pdp-coupon-promo__title">Limited-time offer on this product</p>
        <p className="pdp-coupon-promo__text">{message}</p>
      </div>
      <button
        type="button"
        className="pdp-coupon-promo__cta"
        onClick={onSelect}
        disabled={selected}
      >
        {selected ? "Selected" : "Use offer"}
      </button>
    </div>
  );
}
