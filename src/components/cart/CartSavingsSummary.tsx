"use client";

import { useState } from "react";
import { getCouponEligibilityError } from "@/lib/coupons/couponMath";
import { formatCouponLabel } from "@/lib/coupons/formatCouponLabel";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/currency";

export default function CartSavingsSummary() {
  const items = useCartStore((s) => s.items);
  const itemSavings = useCartStore((s) => s.itemSavings());
  const discount = useCartStore((s) => s.discount());
  const totalSavings = useCartStore((s) => s.totalSavings());
  const couponCode = useCartStore((s) => s.couponCode);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const subtotal = useCartStore((s) => s.subtotal());
  const isApplyingCoupon = useCartStore((s) => s.isApplyingCoupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const [couponInput, setCouponInput] = useState("");

  if (items.length === 0) return null;

  const rows: Array<{ label: string; amount: number }> = [];

  if (itemSavings > 0) {
    rows.push({ label: "Instant discount", amount: itemSavings });
  }

  const ineligibilityMessage =
    couponCode && appliedCoupon && discount <= 0 && subtotal > 0
      ? getCouponEligibilityError(
          {
            isActive: true,
            usedCount: 0,
            minOrderAmount: appliedCoupon.minOrderAmount,
          },
          subtotal
        )
      : null;

  async function handleApply() {
    const ok = await applyCoupon(couponInput);
    if (ok) setCouponInput("");
  }

  return (
    <section className="cart-savings" aria-label="Your savings">
      {totalSavings > 0 ? (
        <>
          <div className="cart-savings__headline">
            <span className="cart-savings__title">You saved</span>
            <strong className="cart-savings__total">
              {formatCurrency(totalSavings)}
            </strong>
          </div>
          {rows.length > 0 ? (
            <ul className="cart-savings__rows">
              {rows.map((row) => (
                <li key={row.label} className="cart-savings__row">
                  <span>{row.label}</span>
                  <span>−{formatCurrency(row.amount)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <div className="cart-savings__headline">
          <span className="cart-savings__title">Coupon</span>
        </div>
      )}

      <div className="cart-savings__coupon">
        {couponCode ? (
          <div className="cart-savings__coupon-applied">
            <div className="cart-savings__coupon-copy">
              <strong>{couponCode}</strong>
              {appliedCoupon ? (
                <span className="cart-savings__coupon-meta">
                  {" "}
                  ({formatCouponLabel(appliedCoupon)})
                </span>
              ) : null}
            </div>
            <div className="cart-savings__coupon-actions">
              {discount > 0 ? (
                <span className="cart-savings__coupon-discount">
                  -{formatCurrency(discount)}
                </span>
              ) : null}
              <button
                type="button"
                className="cart-savings__coupon-remove"
                onClick={removeCoupon}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="cart-savings__coupon-field">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponInput}
              onChange={(e) =>
                setCouponInput(e.target.value.toUpperCase())
              }
              aria-label="Coupon code"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={isApplyingCoupon}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleApply();
                }
              }}
            />
            <button
              type="button"
              className="cart-savings__coupon-apply"
              onClick={() => void handleApply()}
              disabled={isApplyingCoupon || !couponInput.trim()}
            >
              {isApplyingCoupon ? "..." : "Apply"}
            </button>
          </div>
        )}

        {ineligibilityMessage ? (
          <p className="cart-savings__coupon-warning" role="alert">
            {ineligibilityMessage}
          </p>
        ) : null}
        {isApplyingCoupon ? (
          <div className="cart-loading cart-loading--inline" role="status">
            <div className="cart-spinner" aria-hidden="true" />
            Applying coupon...
          </div>
        ) : null}
      </div>
    </section>
  );
}
