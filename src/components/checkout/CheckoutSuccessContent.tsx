"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import {
  clearLastCheckoutMode,
  readLastCheckoutMode,
  useBuyNowStore,
} from "@/store/buyNowStore";
import { formatOrderIdDisplay } from "@/lib/orderId";
import {
  isInvoiceGenerated,
  isPaymentVerified,
  isPlacedOrder,
} from "@/lib/orderPlacement";
import { ROUTES } from "@/lib/routes";
import { formatCurrencyPrecise } from "@/utils/currency";
import {
  clearCachedOrderForConfirmation,
  readCachedCheckoutMode,
  readCachedOrderForConfirmation,
} from "@/lib/checkout/orderConfirmationCache";
import { isInvoiceAvailable, withInvoiceReturnTo } from "@/features/invoice/utils/invoice-utils";
import { getInvoiceDownloadAction } from "@/features/invoice/utils/invoice-actions";
import { useCheckoutSuccessOrder } from "@/hooks/useCheckoutSuccessOrder";
import { trackPurchase } from "@/lib/analytics/events";
import "@/components/checkout/checkout.css";

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const trackingTokenParam = searchParams.get("trackingToken");
  const emailParam = searchParams.get("email");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearCart = useCartStore((s) => s.clearCart);
  const clearBuyNow = useBuyNowStore((s) => s.clearBuyNow);
  const missingOrderId = !orderId;

  const initial =
    orderId != null
      ? (() => {
          const cached = readCachedOrderForConfirmation(orderId);
          return cached ? { order: cached, invoiceUrls: null } : undefined;
        })()
      : undefined;

  const { data, error, isLoading, isError } = useCheckoutSuccessOrder({
    orderId,
    email: emailParam,
    trackingToken: trackingTokenParam,
    isAuthenticated,
    initial,
  });

  const order = data?.order ?? null;
  const invoiceUrls = data?.invoiceUrls ?? null;

  useEffect(() => {
    if (!orderId) return;
    const mode =
      readCachedCheckoutMode(orderId) ?? readLastCheckoutMode();
    if (mode === "buyNow") {
      clearBuyNow();
    } else {
      clearCart();
    }
    clearLastCheckoutMode();
  }, [clearBuyNow, clearCart, orderId]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (orderId && order && isPlacedOrder(order)) {
      clearCachedOrderForConfirmation(orderId);
      trackPurchase(order);
    }
  }, [order, orderId]);

  const trackHref =
    orderId && (trackingTokenParam || order?.trackingToken)
      ? `${ROUTES.trackOrder}?orderId=${encodeURIComponent(orderId)}&trackingToken=${encodeURIComponent(trackingTokenParam ?? order?.trackingToken ?? "")}`
      : ROUTES.trackOrder;

  const resumePaymentHref =
    orderId != null
      ? `/orders/${encodeURIComponent(orderId)}/pay${
          trackingTokenParam
            ? `?trackingToken=${encodeURIComponent(trackingTokenParam)}`
            : ""
        }`
      : ROUTES.checkout;

  if (missingOrderId) {
    return (
      <div className="checkout-success">
        <h1>Order Confirmation</h1>
        <p role="alert">Order ID missing</p>
        <Link href={ROUTES.trackOrder} className="cart-btn cart-btn--checkout">
          Track Order
        </Link>
      </div>
    );
  }

  if (isLoading && !order) {
    return (
      <div className="checkout-success">
        <h1>Order Confirmation</h1>
        <p className="checkout-success__loading">Confirming your order…</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="checkout-success">
        <h1>Order Confirmation</h1>
        <p role="alert">
          {error instanceof Error ? error.message : "Unable to load order"}
        </p>
        <Link href={trackHref} className="cart-btn cart-btn--checkout">
          Track Order
        </Link>
      </div>
    );
  }

  const placed = isPlacedOrder(order);
  const paymentVerified = isPaymentVerified(order);
  const invoiceReady = isInvoiceGenerated(order);
  const invoicePrintUrl = invoiceUrls?.print
    ? withInvoiceReturnTo(invoiceUrls.print, ROUTES.checkoutSuccess)
    : undefined;
  const invoiceDownload = getInvoiceDownloadAction(invoiceUrls);
  const canShowInvoice = isInvoiceAvailable(order);
  const paymentLabel =
    order.paymentStatus === "cod_pending"
      ? "Cash on Delivery"
      : order.paymentStatus === "paid"
        ? "Paid"
        : order.paymentStatus;

  if (!placed) {
    return (
      <div className="checkout-success">
        <div className="checkout-success__hero">
          <div
            className="checkout-success__icon checkout-success__icon--pending"
            aria-hidden="true"
          >
            …
          </div>
          <div>
            <h1>
              {!paymentVerified ? "Payment pending" : "Finalizing your order"}
            </h1>
            <p className="checkout-success__lead">
              Order <strong>{formatOrderIdDisplay(order.id)}</strong> is not
              placed yet.
              {!paymentVerified
                ? " Complete payment to confirm your purchase."
                : " We are generating your tax invoice — this usually takes a moment."}
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
                <span>Invoice</span>
                <strong>{invoiceReady ? "Ready" : "Pending"}</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="checkout-actions checkout-success__actions">
          {!paymentVerified ? (
            <Link href={resumePaymentHref} className="cart-btn cart-btn--checkout">
              Complete payment
            </Link>
          ) : (
            <p className="checkout-success__loading">Updating order status…</p>
          )}
          <Link href={ROUTES.home} className="cart-btn cart-btn--secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-success">
      <div className="checkout-success__hero">
        <div className="checkout-success__icon" aria-hidden="true">
          ✓
        </div>
        <div>
          <h1>Order confirmed</h1>
          <p className="checkout-success__lead">
            Thank you for your purchase. Order{" "}
            <strong>{formatOrderIdDisplay(order.id)}</strong> has been placed
            successfully.
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

          {canShowInvoice && invoiceUrls ? (
            <div className="checkout-success__invoice-actions">
              <a href={invoicePrintUrl} className="cart-btn cart-btn--checkout">
                View invoice
              </a>
              {invoiceDownload ? (
                <a
                  href={invoiceDownload.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cart-btn cart-btn--secondary"
                >
                  {invoiceDownload.label}
                </a>
              ) : null}
            </div>
          ) : canShowInvoice ? (
            <p className="checkout-success__invoice-note">
              Your invoice will be ready shortly. Refresh this page in a moment.
            </p>
          ) : null}
        </div>
      </div>

      <div className="checkout-actions checkout-success__actions">
        <Link href={ROUTES.home} className="cart-btn cart-btn--secondary">
          Continue Shopping
        </Link>
        <Link href={trackHref} className="cart-btn cart-btn--checkout">
          Track Order
        </Link>
      </div>
    </div>
  );
}
