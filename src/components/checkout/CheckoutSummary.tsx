"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { formatCurrencyPrecise } from "@/utils/currency";
import {
  calculateGST,
  DEFAULT_GST_RATE,
  FREE_SHIPPING_THRESHOLD,
  getShippingCharge,
  SELLER_STATE,
  type GSTInvoiceData,
} from "@/lib/gstCalculator";
import type { GSTRate } from "@/lib/gstCalculator";
import { useCartStore } from "@/store/cartStore";
import SwipeToPayButton from "@/components/checkout/SwipeToPayButton";
import type { PaymentMethod } from "@/types/order";

export interface CheckoutSummaryItem {
  productId: string;
  variantId?: string;
  variantSku?: string;
  variantLabel?: string;
  name: string;
  quantity: number;
  price: number;
  gstRate: GSTRate;
}

export interface CheckoutSummaryDisplayItem extends CheckoutSummaryItem {
  lineId?: string;
  image?: string;
  imageColor?: string;
}

export interface CheckoutSummaryProps {
  items: CheckoutSummaryItem[];
  displayItems?: CheckoutSummaryDisplayItem[];
  couponDiscount: number;
  buyerState: string;
  platformFee?: number;
  showLineItems?: boolean;
  showPromo?: boolean;
  className?: string;
  paymentAction?: {
    onPay: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
    preparing?: boolean;
    paymentMethod: PaymentMethod;
    error?: string | null;
  };
}

function SummaryRow({
  label,
  value,
  highlight,
  negative,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={`checkout-summary__row${highlight ? " checkout-summary__row--total" : ""}`}
    >
      <span>{label}</span>
      <span className={negative ? "checkout-summary__negative" : undefined}>
        {value}
      </span>
    </div>
  );
}

export function computeCheckoutInvoice(
  items: CheckoutSummaryItem[],
  couponDiscount: number,
  buyerState: string,
  platformFee = 0
): GSTInvoiceData {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCharge = getShippingCharge(subtotal, couponDiscount);

  return calculateGST({
    items: items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      gstRate: item.gstRate ?? DEFAULT_GST_RATE,
    })),
    couponDiscount,
    shippingCharge,
    platformFee,
    sellerState: SELLER_STATE,
    buyerState,
  });
}

export default function CheckoutSummary({
  items,
  displayItems,
  couponDiscount,
  buyerState,
  platformFee = 0,
  showLineItems = false,
  showPromo = false,
  className = "",
  paymentAction,
}: CheckoutSummaryProps) {
  const invoice = computeCheckoutInvoice(
    items,
    couponDiscount,
    buyerState,
    platformFee
  );

  const couponCode = useCartStore((s) => s.couponCode);
  const couponPercent = useCartStore((s) => s.couponDiscount);
  const isApplyingCoupon = useCartStore((s) => s.isApplyingCoupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const [couponInput, setCouponInput] = useState("");
  const lineItems: CheckoutSummaryDisplayItem[] =
    displayItems ?? items.map((item) => ({ ...item }));
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAfterDiscount = invoice.subtotal - invoice.couponDiscount;
  const shippingRemaining = Math.max(
    FREE_SHIPPING_THRESHOLD - subtotalAfterDiscount,
    0
  );
  const shippingProgress = Math.min(
    (subtotalAfterDiscount / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );

  async function handleApplyCoupon() {
    const ok = await applyCoupon(couponInput);
    if (ok) setCouponInput("");
  }

  return (
    <aside className={`checkout-summary ${className}`.trim()}>
      <div className="checkout-summary__head">
        <h3 className="checkout-summary__title">Order Summary</h3>
        <span className="checkout-summary__badge">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      {showLineItems ? (
        <ul className="checkout-summary__items">
          {lineItems.map((item, index) => {
            const key =
              item.lineId ?? `${item.productId}-${item.variantId ?? "base"}-${index}`;
            return (
              <li key={key} className="checkout-summary__product">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt=""
                    className="checkout-summary__thumb"
                  />
                ) : (
                  <div
                    className="checkout-summary__thumb"
                    style={{
                      background: item.imageColor ?? "#eee",
                    }}
                  />
                )}
                <div className="checkout-summary__product-info">
                  <strong>{item.name}</strong>
                  <span>Qty {item.quantity}</span>
                </div>
                <span className="checkout-summary__product-price">
                  {formatCurrencyPrecise(item.price * item.quantity)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {showLineItems && shippingRemaining > 0 ? (
        <div className="checkout-summary__shipping-bar">
          <div
            className="checkout-summary__shipping-fill"
            style={{ width: `${shippingProgress}%` }}
          />
          <p>
            Add {formatCurrencyPrecise(shippingRemaining)} more for free shipping
          </p>
        </div>
      ) : null}

      {showPromo ? (
        <div className="checkout-summary__promo">
          {couponCode ? (
            <div className="checkout-summary__promo-applied">
              <span>
                <strong>{couponCode}</strong> ({couponPercent}% off)
              </span>
              <button type="button" onClick={removeCoupon}>
                Remove
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="e.g. SAVE10"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                aria-label="Promo code"
                disabled={isApplyingCoupon}
              />
              <button
                type="button"
                className="checkout-summary__promo-apply"
                onClick={() => void handleApplyCoupon()}
                disabled={isApplyingCoupon || !couponInput.trim()}
              >
                {isApplyingCoupon ? "…" : "Apply"}
              </button>
            </>
          )}
          {!couponCode ? (
            <p className="checkout-summary__promo-hint">
              Try SAVE10, SWEET15, or GEAR20
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="checkout-summary__totals">
        <SummaryRow
          label="Subtotal"
          value={formatCurrencyPrecise(invoice.subtotal)}
        />

        {invoice.couponDiscount > 0 ? (
          <SummaryRow
            label="Discount"
            value={`−${formatCurrencyPrecise(invoice.couponDiscount)}`}
            negative
          />
        ) : null}

        <SummaryRow
          label="Shipping"
          value={
            invoice.shippingCharge === 0
              ? "FREE"
              : formatCurrencyPrecise(invoice.shippingCharge)
          }
        />

        {invoice.platformFee > 0 ? (
          <SummaryRow
            label="Platform Fee"
            value={formatCurrencyPrecise(invoice.platformFee)}
          />
        ) : null}

        <SummaryRow
          label="Total"
          value={formatCurrencyPrecise(invoice.grandTotal)}
          highlight
        />
      </div>

      {paymentAction ? (
        <div className="checkout-summary__pay">
          {paymentAction.paymentMethod === "razorpay" ? (
            <SwipeToPayButton
              onConfirm={paymentAction.onPay}
              disabled={paymentAction.disabled}
              loading={paymentAction.loading}
              preparing={paymentAction.preparing}
            />
          ) : (
            <button
              type="button"
              className="cart-btn cart-btn--checkout checkout-summary__cod-btn"
              onClick={() => void paymentAction.onPay()}
              disabled={paymentAction.disabled || paymentAction.loading}
            >
              {paymentAction.loading ? "Placing order…" : "Place order (COD)"}
            </button>
          )}
          {paymentAction.error ? (
            <p className="payment-button__error" role="alert">
              {paymentAction.error}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="checkout-summary__trust">
        <Lock size={12} aria-hidden />
        Secure checkout in INR (₹) · UPI · Cards · Net Banking · COD
      </p>
    </aside>
  );
}

export { type GSTInvoiceData };
