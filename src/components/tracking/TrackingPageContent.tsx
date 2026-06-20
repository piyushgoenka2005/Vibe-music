"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackOrder } from "@/services/order.service";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import type { OrderTracking } from "@/types/orderTracking";

export default function TrackingPageContent() {
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const urlOrderId = searchParams.get("orderId") ?? "";
  const urlEmail = searchParams.get("email") ?? user?.email ?? "";
  const [orderIdInput, setOrderIdInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const orderId = orderIdInput || urlOrderId;
  const email = emailInput || urlEmail;
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const result = await trackOrder(orderId.trim(), email.trim());
      if (!result) {
        setError("No order found for that ID and email combination.");
        return;
      }
      setOrder(result);
    } catch {
      setError("Unable to look up order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="storefront-page storefront-page--subtle">
      <section className="track-page">
        <header className="track-page__header">
          <p className="storefront-page__eyebrow">Order status</p>
          <h1 className="track-page__title">Track your order</h1>
          <p className="track-page__lead">
            Enter your order ID and the email used at checkout.
          </p>
        </header>

        <form className="track-form" onSubmit={onSubmit}>
          <label className="track-form__field">
            Order ID
            <input
              className="track-form__input"
              value={orderId}
              onChange={(e) => setOrderIdInput(e.target.value)}
              required
            />
          </label>
          <label className="track-form__field">
            Email
            <input
              className="track-form__input"
              type="email"
              value={email}
              onChange={(e) => setEmailInput(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="track-form__submit" disabled={loading}>
            {loading ? "Looking up..." : "Track order"}
          </button>
        </form>

        {error ? (
          <p role="alert" className="track-error">
            {error}
          </p>
        ) : null}

        {order ? (
          <div className="track-result">
            <h2>Order {order.orderNumber}</h2>
            <p>Status: {order.status}</p>
            <p>Payment: {order.paymentStatus}</p>
            <p>Total: {formatCurrency(order.total)}</p>
            {order.trackingNumber ? (
              <p>
                Tracking: {order.trackingNumber}
                {order.carrier ? ` (${order.carrier})` : ""}
              </p>
            ) : null}
            {order.estimatedDelivery ? (
              <p>Estimated delivery: {order.estimatedDelivery}</p>
            ) : null}
            <ul>
              {order.items.map((item, index) => (
                <li key={`${item.productId}-${index}`}>
                  {item.quantity} × {item.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="track-page__footer">
          {isAuthenticated ? (
            <Link href={ROUTES.accountOrders}>View account orders</Link>
          ) : (
            <>
              <Link href={`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.trackOrder)}`}>
                Log in
              </Link>
              {" · "}
              <Link href={ROUTES.home}>Continue shopping</Link>
            </>
          )}
        </p>
      </section>
    </main>
  );
}
