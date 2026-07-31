"use client";

import { useState } from "react";
import Link from "next/link";
import { buildCartShippingState } from "@/lib/cart/cartShipping";
import { computeMrpTotal } from "@/lib/cart/promoGift";
import { ROUTES } from "@/lib/routes";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/currency";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CartStickyFooterProps {
  checkoutHref?: string;
  onCheckout?: () => void;
  showViewCartLink?: boolean;
  onContinueShopping?: () => void;
}

export default function CartStickyFooter({
  checkoutHref = ROUTES.checkout,
  onCheckout,
  showViewCartLink = false,
  onContinueShopping,
}: CartStickyFooterProps) {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const totalSavings = useCartStore((s) => s.totalSavings());
  const itemSavings = useCartStore((s) => s.itemSavings());
  const discount = useCartStore((s) => s.discount());
  const subtotal = useCartStore((s) => s.subtotal());
  const paidSubtotal = useCartStore((s) => s.paidSubtotal());
  const promoConfig = useCartStore((s) => s.promoConfig);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const mrpTotal = computeMrpTotal(items);
  const showMrpStrike = mrpTotal > total + 0.009;
  const shipping = buildCartShippingState(paidSubtotal, promoConfig);
  const showLinks = Boolean(showViewCartLink || onContinueShopping);

  function handleCheckoutClick() {
    closeDrawer();
    onCheckout?.();
  }

  return (
    <footer className="cart-sticky-footer">
      {totalSavings > 0 ? (
        <p className="cart-sticky-footer__savings">
          Saving {formatCurrency(totalSavings)}
        </p>
      ) : null}

      <div className="cart-sticky-footer__panel">
        <div className="cart-sticky-footer__summary">
          <button
            type="button"
            className="cart-sticky-footer__total-wrap"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls="cart-sticky-footer-breakdown"
            aria-label={
              expanded ? "Hide price breakdown" : "Show price breakdown"
            }
          >
            <span className="cart-sticky-footer__total-label">
              Order total
              <span className="cart-sticky-footer__chevron" aria-hidden>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </span>
            <span className="cart-sticky-footer__total-values">
              {showMrpStrike ? (
                <span className="cart-sticky-footer__total-mrp">
                  {formatCurrency(mrpTotal)}
                </span>
              ) : null}
              <span className="cart-sticky-footer__total-amount">
                {formatCurrency(total)}
              </span>
            </span>
          </button>

          <p className="cart-sticky-footer__meta">
            {shipping.unlocked
              ? "Free shipping · Taxes included"
              : `${shipping.amountLabel} shipping · Taxes included`}
          </p>

          {expanded ? (
            <div
              id="cart-sticky-footer-breakdown"
              className="cart-sticky-footer__breakdown"
            >
              <div className="cart-sticky-footer__row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {itemSavings > 0 ? (
                <div className="cart-sticky-footer__row cart-sticky-footer__row--discount">
                  <span>Product savings</span>
                  <span>−{formatCurrency(itemSavings)}</span>
                </div>
              ) : null}
              {discount > 0 ? (
                <div className="cart-sticky-footer__row cart-sticky-footer__row--discount">
                  <span>Coupon</span>
                  <span>−{formatCurrency(discount)}</span>
                </div>
              ) : null}
              <div className="cart-sticky-footer__row">
                <span>Shipping</span>
                <span>{shipping.amountLabel}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="cart-sticky-footer__actions">
          {onCheckout ? (
            <button
              type="button"
              className="cart-sticky-footer__checkout"
              onClick={handleCheckoutClick}
            >
              Checkout
            </button>
          ) : (
            <Link
              href={checkoutHref}
              className="cart-sticky-footer__checkout"
              onClick={closeDrawer}
            >
              Checkout
            </Link>
          )}
        </div>

        {showLinks ? (
          <div className="cart-sticky-footer__links">
            {onContinueShopping ? (
              <button
                type="button"
                className="cart-sticky-footer__continue"
                onClick={onContinueShopping}
              >
                Continue shopping
              </button>
            ) : null}

            {showViewCartLink ? (
              <Link
                href={ROUTES.cart}
                className="cart-sticky-footer__view-cart"
                onClick={closeDrawer}
              >
                View full cart
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
