"use client";

import { useMemo } from "react";
import { BadgePercent } from "lucide-react";
import { buildProductCouponCopy } from "@/lib/product/productCouponDisplay";
import { useCartActiveCoupons } from "@/hooks/useCartActiveCoupons";
import { useCartStore } from "@/store/cartStore";

interface ApplicableCouponsPickerProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: "cart" | "checkout";
}

export default function ApplicableCouponsPicker({
  className,
  style,
  variant = "checkout",
}: ApplicableCouponsPickerProps) {
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const isApplyingCoupon = useCartStore((s) => s.isApplyingCoupon);

  const productIds = useMemo(() => [...new Set(items.map((item) => item.productId))], [items]);
  const { coupons, isLoading } = useCartActiveCoupons(productIds);

  if (productIds.length === 0) return null;

  const hasOffers = (coupons?.length ?? 0) > 0;
  if (!isLoading && !hasOffers) return null;

  const labelClass =
    variant === "cart" ? "cart-savings__offers-label" : "checkout-summary__promo-label";
  const hintClass =
    variant === "cart" ? "cart-savings__offers-hint" : "checkout-summary__promo-hint";
  const listClass = variant === "cart" ? "cart-savings__offers-list" : undefined;

  return (
    <div className={className} style={style}>
      <p className={labelClass}>
        <BadgePercent size={13} strokeWidth={2.25} aria-hidden />
        Available offers for your items
      </p>
      {isLoading ? (
        <p className={hintClass}>Loading offers…</p>
      ) : (
        <ul className={listClass}>
          {coupons?.map((offer) => {
            const copy = buildProductCouponCopy(offer);
            const selected = couponCode === offer.code;
            return (
              <li key={offer.code}>
                <button
                  type="button"
                  className={`cart-savings__offer${selected ? " cart-savings__offer--selected" : ""}`}
                  disabled={isApplyingCoupon || selected}
                  onClick={() => void applyCoupon(offer.code)}
                >
                  <span className="cart-savings__offer-code">{copy.code}</span>
                  <span className="cart-savings__offer-copy">{copy.offerLine}</span>
                  {copy.termsLine && copy.termsLine !== copy.offerLine ? (
                    <span className="cart-savings__offer-terms">{copy.termsLine}</span>
                  ) : null}
                  {copy.maxDiscountLine ? (
                    <span className="cart-savings__offer-max">{copy.maxDiscountLine}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
