"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchGuestOrder, fetchOrder } from "@/services/orderService";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { formatOrderIdDisplay } from "@/lib/orderId";
import { ROUTES } from "@/lib/routes";
import { formatCurrencyPrecise } from "@/utils/currency";
import {
  clearCachedOrderForConfirmation,
  readCachedOrderForConfirmation,
} from "@/lib/checkout/orderConfirmationCache";
import { isInvoiceAvailable } from "@/features/invoice/utils/invoice-utils";
import type { Order } from "@/types/order";
import "@/components/checkout/checkout.css";

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const emailParam = searchParams.get("email");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearCart = useCartStore((s) => s.clearCart);
  const missingOrderId = !orderId;
  const [order, setOrder] = useState<Order | null>(() =>
    orderId ? readCachedOrderForConfirmation(orderId) : null
  );
  const [error, setError] = useState<string | null>(
    missingOrderId ? "Order ID missing" : null
  );
  const [loading, setLoading] = useState(!missingOrderId && !order);

  useEffect(() => {
    if (orderId) {
      clearCart();
    }
  }, [clearCart, orderId]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

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

  const invoiceQuery = emailParam
    ? `?email=${encodeURIComponent(emailParam)}`
    : "";
  const invoiceViewUrl = `/api/invoices/${encodeURIComponent(order.id)}/html${invoiceQuery}`;
  const invoicePrintUrl = `${invoiceViewUrl}${invoiceQuery ? "&" : "?"}print=1`;

  const canShowInvoice = isInvoiceAvailable(order);
  const paymentLabel =
    order.paymentStatus === "cod_pending"
      ? "Cash on Delivery"
      : order.paymentStatus === "paid"
        ? "Paid"
        : order.paymentStatus;

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

          {canShowInvoice ? (
            <div className="checkout-success__invoice-actions">
              <a
                href={invoiceViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cart-btn cart-btn--secondary"
              >
                View invoice
              </a>
              <a
                href={invoicePrintUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cart-btn cart-btn--checkout"
              >
                Print invoice
              </a>
            </div>
          ) : (
            <p className="checkout-success__invoice-note">
              Your invoice will be ready shortly. Refresh this page in a moment.
            </p>
          )}
        </div>
      </div>

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
