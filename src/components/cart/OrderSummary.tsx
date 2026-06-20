"use client";

import { ROUTES } from "@/lib/routes";
import CheckoutGlassButton from "@/components/checkout/CheckoutGlassButton";
import { formatCurrency } from "@/utils/currency";
import { formatCouponLabel } from "@/lib/coupons/formatCouponLabel";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";

interface OrderSummaryProps {
  showCoupon?: boolean;
  checkoutHref?: string;
  onCheckout?: () => void;
  compact?: boolean;
}

export default function OrderSummary({
  showCoupon = true,
  checkoutHref = "/checkout",
  onCheckout,
  compact = false,
}: OrderSummaryProps) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount());
  const total = useCartStore((s) => s.total());
  const couponCode = useCartStore((s) => s.couponCode);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const isApplyingCoupon = useCartStore((s) => s.isApplyingCoupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const closeDrawer = useCartStore((s) => s.closeDrawer);

  const [couponInput, setCouponInput] = useState("");

  async function handleApplyCoupon() {
    const ok = await applyCoupon(couponInput);
    if (ok) setCouponInput("");
  }

  if (items.length === 0) return null;

  return (
    <div className="cart-summary">
      <h3 className="cart-summary__title">Order Summary</h3>

      {showCoupon ? (
        <div className="cart-coupon">
          {couponCode ? (
            <div style={{ flex: 1, fontSize: 14 }}>
              <strong>{couponCode}</strong>
              {appliedCoupon ? ` (${formatCouponLabel(appliedCoupon)})` : null}{" "}
              <button
                type="button"
                className="cart-item__remove"
                onClick={removeCoupon}
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                aria-label="Coupon code"
                disabled={isApplyingCoupon}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponInput.trim()}
              >
                {isApplyingCoupon ? "..." : "Apply"}
              </button>
            </>
          )}
        </div>
      ) : null}

      {isApplyingCoupon ? (
        <div className="cart-loading" role="status">
          <div className="cart-spinner" aria-hidden="true" />
          Applying coupon...
        </div>
      ) : null}

      <div className="cart-summary__row">
        <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      {discount > 0 ? (
        <div className="cart-summary__row cart-summary__discount">
          <span>Discount</span>
          <span>−{formatCurrency(discount)}</span>
        </div>
      ) : null}

      <div className="cart-summary__row">
        <span>Shipping</span>
        <span>{subtotal >= 99 ? "FREE" : "Calculated at checkout"}</span>
      </div>

      <div className="cart-summary__row cart-summary__row--total">
        <span>Estimated Total</span>
        <span>{formatCurrency(total)}</span>
      </div>

      {onCheckout ? (
        <CheckoutGlassButton onClick={onCheckout}>Checkout</CheckoutGlassButton>
      ) : (
        <CheckoutGlassButton href={checkoutHref} onClick={closeDrawer}>
          Checkout
        </CheckoutGlassButton>
      )}

      {!compact ? (
        <CheckoutGlassButton href={ROUTES.search} variant="ghost">
          Continue Shopping
        </CheckoutGlassButton>
      ) : (
        <CheckoutGlassButton href="/cart" onClick={closeDrawer} variant="ghost">
          View Cart
        </CheckoutGlassButton>
      )}
    </div>
  );
}
