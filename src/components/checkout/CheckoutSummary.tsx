"use client";

import { formatCurrencyPrecise } from "@/utils/currency";
import {
  calculateGST,
  DEFAULT_GST_RATE,
  getShippingCharge,
  SELLER_STATE,
  type GSTInvoiceData,
} from "@/lib/gstCalculator";
import type { GSTRate } from "@/lib/gstCalculator";

export interface CheckoutSummaryItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  gstRate: GSTRate;
}

export interface CheckoutSummaryProps {
  items: CheckoutSummaryItem[];
  couponDiscount: number;
  buyerState: string;
  platformFee?: number;
  showGstBreakdown?: boolean;
  className?: string;
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
  couponDiscount,
  buyerState,
  platformFee = 0,
  showGstBreakdown = true,
  className = "",
}: CheckoutSummaryProps) {
  const invoice = computeCheckoutInvoice(
    items,
    couponDiscount,
    buyerState,
    platformFee
  );

  return (
    <div className={`checkout-summary ${className}`.trim()}>
      <h3 className="checkout-summary__title">Order Summary</h3>

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

      {showGstBreakdown ? (
        <div className="checkout-summary__gst">
          <SummaryRow
            label={`GST (${invoice.isInterState ? "IGST" : "Total"})`}
            value={formatCurrencyPrecise(invoice.totalGst)}
          />

          {invoice.isInterState ? (
            <p className="checkout-summary__gst-detail">
              IGST @ {invoice.igstDisplayRate}%
            </p>
          ) : (
            <p className="checkout-summary__gst-detail">
              GST Included — CGST: {invoice.cgstDisplayRate}% · SGST:{" "}
              {invoice.sgstDisplayRate}%
            </p>
          )}
        </div>
      ) : null}

      <SummaryRow
        label="Total"
        value={formatCurrencyPrecise(invoice.grandTotal)}
        highlight
      />
    </div>
  );
}

export { type GSTInvoiceData };
