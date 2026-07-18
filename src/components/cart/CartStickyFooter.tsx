"use client";

import { useState } from "react";
import CheckoutGlassButton from "@/components/checkout/CheckoutGlassButton";
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

  return (
    <footer className="cart-sticky-footer">
      <div className="cart-sticky-footer__bar">
        <button
          type="button"
          className="cart-sticky-footer__total-wrap"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          <span className="cart-sticky-footer__total-label">
            Estimated Total
            {expanded ? (
              <ChevronUp size={16} aria-hidden />
            ) : (
              <ChevronDown size={16} aria-hidden />
            )}
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

        {onCheckout ? (
          <CheckoutGlassButton
            className="cart-sticky-footer__checkout"
            onClick={onCheckout}
            variant="solid"
          >
            Proceed to Checkout
          </CheckoutGlassButton>
        ) : (
          <CheckoutGlassButton
            className="cart-sticky-footer__checkout"
            href={checkoutHref}
            onClick={closeDrawer}
            variant="solid"
          >
            Proceed to Checkout
          </CheckoutGlassButton>
        )}
      </div>

      {expanded ? (
        <div className="cart-sticky-footer__breakdown">
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
              <span>Coupon savings</span>
              <span>−{formatCurrency(discount)}</span>
            </div>
          ) : null}
          {totalSavings > 0 ? (
            <div className="cart-sticky-footer__row cart-sticky-footer__row--discount">
              <span>Total savings</span>
              <span>−{formatCurrency(totalSavings)}</span>
            </div>
          ) : null}
          <div className="cart-sticky-footer__row">
            <span>Shipping</span>
            <span>{shipping.amountLabel}</span>
          </div>
        </div>
      ) : null}

      {showViewCartLink || onContinueShopping ? (
        <div className="cart-sticky-footer__links">
          {onContinueShopping ? (
            <button
              type="button"
              className="cart-sticky-footer__continue"
              onClick={onContinueShopping}
            >
              Continue Shopping
            </button>
          ) : null}

          {showViewCartLink ? (
            <CheckoutGlassButton
              className="cart-sticky-footer__view-cart"
              href={ROUTES.cart}
              onClick={closeDrawer}
              variant="ghost"
            >
              View full cart
            </CheckoutGlassButton>
          ) : null}
        </div>
      ) : null}
    </footer>
  );
}
