"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchGuestOrder, fetchOrder } from "@/services/orderService";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/routes";
import { formatCurrencyPrecise } from "@/utils/currency";
import type { Order } from "@/types/order";
import "@/components/checkout/checkout.css";
import { InvoiceToolbar } from "@/features/invoice/ui/InvoiceToolbar";
import { InvoicePreviewCard } from "@/features/invoice/ui/InvoicePreviewCard";

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const emailParam = searchParams.get("email");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const missingOrderId = !orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(
    missingOrderId ? "Order ID missing" : null
  );
  const [loading, setLoading] = useState(!missingOrderId);

  useEffect(() => {
    if (!orderId) return;

    async function loadOrder() {
      try {
        if (isAuthenticated) {
          const authenticatedOrder = await fetchOrder(orderId!);
          setOrder(authenticatedOrder);
          return;
        }

        if (!emailParam) {
          setError("Email is required to view this order");
          return;
        }

        const guestOrder = await fetchGuestOrder(orderId!, emailParam);
        setOrder(guestOrder);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to load order");
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

  if (loading) {
    return (
      <div className="checkout-success">
        <p>Loading order confirmation...</p>
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

  const canShowInvoice =
    order.paymentStatus === "paid" && Boolean(order.invoice?.invoiceNumber);

  const pdfEnabled = process.env.NEXT_PUBLIC_INVOICE_PDF_ENABLED === "true";

  return (
    <div className="checkout-success">
      <div className="checkout-success__icon" aria-hidden="true">
        ✓
      </div>
      <h1>Order Confirmed!</h1>
      <p>
        Thank you for your purchase. Order <strong>{order.id}</strong> has been
        placed successfully.
      </p>
      <p>
        A confirmation email has been sent to <strong>{order.email}</strong>.
      </p>
      <p>
        Payment status:{" "}
        <strong>
          {order.paymentStatus === "cod_pending"
            ? "Cash on Delivery"
            : order.paymentStatus}
        </strong>
      </p>
      <p>Total paid: {formatCurrencyPrecise(order.total)}</p>

      <section className="checkout-invoice" aria-label="Invoice">
        <h2 className="checkout-invoice__title">Invoice</h2>

        <InvoiceToolbar
          order={order}
          invoiceUrl={invoiceUrl}
          pdfUrl={
            pdfEnabled ? invoiceFrameSrc.replace("/html", "/pdf") : undefined
          }
        />

        {canShowInvoice ? (
          <div className="invoice-frame-wrap">
            <iframe title="Tax invoice preview" className="invoice-frame" src={invoiceFrameSrc} />
          </div>
        ) : (
          <p className="checkout-invoice__muted">
            Invoice will be available after payment confirmation.
          </p>
        )}

        <InvoicePreviewCard order={order} invoiceUrl={invoiceUrl} />
      </section>

      <div className="checkout-actions" style={{ justifyContent: "center", marginTop: 24 }}>
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
