"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchGuestOrder, fetchOrder } from "@/services/orderService";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/routes";
import { formatCurrencyPrecise } from "@/utils/currency";
import {
  clearCachedOrderForConfirmation,
  readCachedOrderForConfirmation,
} from "@/lib/checkout/orderConfirmationCache";
import { isInvoiceAvailable } from "@/features/invoice/utils/invoice-utils";
import type { Order } from "@/types/order";
import "@/components/checkout/checkout.css";
import { InvoiceToolbar } from "@/features/invoice/ui/InvoiceToolbar";
import { InvoicePreviewCard } from "@/features/invoice/ui/InvoicePreviewCard";
import { InvoiceEmbed } from "@/components/checkout/InvoiceEmbed";

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const emailParam = searchParams.get("email");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const missingOrderId = !orderId;
  const [order, setOrder] = useState<Order | null>(() =>
    orderId ? readCachedOrderForConfirmation(orderId) : null
  );
  const [error, setError] = useState<string | null>(
    missingOrderId ? "Order ID missing" : null
  );
  const [loading, setLoading] = useState(!missingOrderId && !order);

  useEffect(() => {
    if (!orderId) return;

    const resolvedOrderId = orderId;
    const cached = readCachedOrderForConfirmation(resolvedOrderId);

    async function loadOrder() {
      try {
        let loaded: Order;

        if (isAuthenticated) {
          loaded = await fetchOrder(resolvedOrderId);
        } else {
          if (!emailParam) {
            if (!cached) {
              setError("Email is required to view this order");
            }
            return;
          }
          loaded = await fetchGuestOrder(resolvedOrderId, emailParam);
        }

        setOrder(loaded);
        clearCachedOrderForConfirmation(resolvedOrderId);
      } catch (err: unknown) {
        if (!cached) {
          setError(err instanceof Error ? err.message : "Unable to load order");
        }
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [orderId, emailParam, isAuthenticated]);

  const trackHref =
    orderId && (emailParam || order?.email)
      ? `${ROUTES.trackOrder}?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(emailParam ?? order?.email ?? "")}`
      : ROUTES.trackOrder;

  if (loading && !order) {
    return (
      <div className="checkout-success">
        <p className="checkout-success__loading">Confirming your order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="checkout-success">
        <h1>Order Confirmation</h1>
        <p role="alert">{error ?? "Order not found"}</p>
        <Link href={trackHref} className="cart-btn cart-btn--checkout">
          Track Order
        </Link>
      </div>
    );
  }

  const invoiceUrl = emailParam
    ? `/orders/${encodeURIComponent(order.id)}/invoice?email=${encodeURIComponent(emailParam)}`
    : `/orders/${encodeURIComponent(order.id)}/invoice`;

  const invoiceFrameSrc = emailParam
    ? `/api/invoices/${encodeURIComponent(order.id)}/html?email=${encodeURIComponent(emailParam)}`
    : `/api/invoices/${encodeURIComponent(order.id)}/html`;

  const canShowInvoice = isInvoiceAvailable(order);
  const pdfEnabled = process.env.NEXT_PUBLIC_INVOICE_PDF_ENABLED === "true";
  const paymentLabel =
    order.paymentStatus === "cod_pending"
      ? "Cash on Delivery"
      : order.paymentStatus === "paid"
        ? "Paid"
        : order.paymentStatus;

  return (
    <div className="checkout-success checkout-success--with-invoice">
      <div className="checkout-success__hero">
        <div className="checkout-success__icon" aria-hidden="true">
          ✓
        </div>
        <div>
          <h1>Order confirmed</h1>
          <p className="checkout-success__lead">
            Thank you for your purchase. Order{" "}
            <strong>{order.id}</strong> has been placed successfully.
          </p>
          <ul className="checkout-success__meta">
            <li>
              <span>Email</span>
              <strong>{order.email}</strong>
            </li>
            <li>
              <span>Payment</span>
              <strong>{paymentLabel}</strong>
            </li>
            <li>
              <span>Total</span>
              <strong>{formatCurrencyPrecise(order.total)}</strong>
            </li>
            {order.invoice?.invoiceNumber ? (
              <li>
                <span>Invoice</span>
                <strong>{order.invoice.invoiceNumber}</strong>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <section className="checkout-invoice" aria-label="Tax invoice">
        <h2 className="checkout-invoice__title">Your invoice</h2>

        <InvoiceToolbar
          order={order}
          invoiceUrl={invoiceUrl}
          pdfUrl={
            pdfEnabled && canShowInvoice
              ? invoiceFrameSrc.replace("/html", "/pdf")
              : undefined
          }
        />

        {canShowInvoice ? (
          <InvoiceEmbed src={invoiceFrameSrc} title="Tax invoice" />
        ) : (
          <p className="checkout-invoice__muted">
            Your invoice is being prepared. Refresh this page in a moment or
            check your email.
          </p>
        )}

        <InvoicePreviewCard order={order} invoiceUrl={invoiceUrl} />
      </section>

      <div className="checkout-actions checkout-success__actions">
        <Link href={ROUTES.home} className="cart-btn cart-btn--secondary">
          Continue Shopping
        </Link>
        <Link href={trackHref} className="cart-btn cart-btn--checkout">
          Track Order
        </Link>
        {isAuthenticated ? (
          <Link href={ROUTES.accountOrders} className="cart-btn cart-btn--secondary">
            View My Orders
          </Link>
        ) : (
          <Link
            href={`${ROUTES.register}?redirect=${encodeURIComponent(ROUTES.accountOrders)}`}
            className="cart-btn cart-btn--secondary"
          >
            Create Account
          </Link>
        )}
      </div>
    </div>
  );
}
