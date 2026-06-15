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

  const invoice = order.invoice;

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

      <div className="checkout-invoice">
        <h2 className="checkout-invoice__title">
          GST Invoice {invoice?.invoiceNumber ?? ""}
        </h2>

        {invoice ? (
          <>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
              {invoice.isInterState
                ? `IGST @ ${invoice.igstDisplayRate}%`
                : `CGST ${invoice.cgstDisplayRate}% + SGST ${invoice.sgstDisplayRate}%`}
            </p>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Taxable</th>
                  <th>GST</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineBreakdown.map((line) => (
                  <tr key={line.productId}>
                    <td>{line.name}</td>
                    <td>{line.quantity}</td>
                    <td>{formatCurrencyPrecise(line.taxableAmount)}</td>
                    <td>{formatCurrencyPrecise(line.gstAmount)}</td>
                    <td>{formatCurrencyPrecise(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 16, fontSize: 14 }}>
              <div>Subtotal: {formatCurrencyPrecise(invoice.subtotal)}</div>
              {invoice.couponDiscount > 0 ? (
                <div>Discount: −{formatCurrencyPrecise(invoice.couponDiscount)}</div>
              ) : null}
              <div>
                Shipping:{" "}
                {invoice.shippingCharge === 0
                  ? "FREE"
                  : formatCurrencyPrecise(invoice.shippingCharge)}
              </div>
              <div>CGST: {formatCurrencyPrecise(invoice.totalCgst)}</div>
              <div>SGST: {formatCurrencyPrecise(invoice.totalSgst)}</div>
              <div>IGST: {formatCurrencyPrecise(invoice.totalIgst)}</div>
              <div>
                <strong>Grand Total: {formatCurrencyPrecise(invoice.grandTotal)}</strong>
              </div>
            </div>
          </>
        ) : null}
      </div>

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
