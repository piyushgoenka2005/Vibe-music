"use client";

import { useMemo, useState } from "react";
import { buildProductCouponCopy } from "@/lib/product/productCouponDisplay";
import { useCartActiveCoupons } from "@/hooks/useCartActiveCoupons";
import { type CouponLineInput, useCartStore } from "@/store/cartStore";
import type { StorefrontCouponOffer } from "@/types/coupon";

interface ActiveCouponsDropdownProps {
  productIds: string[];
  couponLines?: CouponLineInput[];
}

function formatCouponOption(offer: StorefrontCouponOffer): string {
  const copy = buildProductCouponCopy(offer);
  const detail = copy.offerLine || copy.headline;
  return detail ? `${copy.code} — ${detail}` : copy.code;
}

export default function ActiveCouponsDropdown({
  productIds,
  couponLines,
}: ActiveCouponsDropdownProps) {
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const isApplyingCoupon = useCartStore((s) => s.isApplyingCoupon);
  const [selectedCode, setSelectedCode] = useState("");

  const stableProductIds = useMemo(
    () => [...new Set(productIds.map((id) => id.trim()).filter(Boolean))],
    [productIds],
  );
  const { coupons, isLoading } = useCartActiveCoupons(stableProductIds);

  if (stableProductIds.length === 0) return null;

  async function handleSelect(code: string) {
    if (!code || isApplyingCoupon) return;
    setSelectedCode(code);
    const ok = await applyCoupon(code, couponLines?.length ? { items: couponLines } : undefined);
    if (!ok) setSelectedCode("");
  }

  const hasOffers = (coupons?.length ?? 0) > 0;

  return (
    <div className="checkout-summary__promo-select-wrap">
      <label className="checkout-summary__promo-select-label" htmlFor="checkout-active-coupons">
        Available offers
      </label>
      <select
        id="checkout-active-coupons"
        className="checkout-summary__promo-select"
        value={selectedCode}
        disabled={isApplyingCoupon || isLoading || !hasOffers}
        onChange={(e) => void handleSelect(e.target.value)}
        aria-busy={isLoading || isApplyingCoupon}
      >
        <option value="">
          {isLoading
            ? "Loading active offers…"
            : hasOffers
              ? "Select an offer"
              : "No active offers for your items"}
        </option>
        {coupons?.map((offer) => (
          <option key={offer.code} value={offer.code}>
            {formatCouponOption(offer)}
          </option>
        ))}
      </select>
    </div>
  );
}
