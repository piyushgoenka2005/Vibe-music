"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackOrder } from "@/services/order.service";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import type { OrderTracking } from "@/types/orderTracking";
import type { PublicShipmentTracking } from "@/types/shipment";
import ShipmentTimeline from "@/components/tracking/ShipmentTimeline";

export default function TrackingPageContent() {
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const urlOrderId = searchParams.get("orderId") ?? "";
  const urlTrackingToken = searchParams.get("trackingToken") ?? "";
  const [orderIdInput, setOrderIdInput] = useState("");
  const [trackingTokenInput, setTrackingTokenInput] = useState("");
  const orderId = orderIdInput || urlOrderId;
  const trackingToken = trackingTokenInput || urlTrackingToken;
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [shipment, setShipment] = useState<PublicShipmentTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    setShipment(null);
    try {
      const result = await trackOrder(orderId.trim(), trackingToken.trim());
      if (!result) {
        setError("No order found for that ID and tracking token.");
        return;
      }
      setOrder(result.order);
      setShipment(result.shipment);
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
            Enter your order ID and tracking token from your confirmation email
            to see shipment status and delivery updates.
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
            Tracking token
            <input
              className="track-form__input"
              value={trackingToken}
              onChange={(e) => setTrackingTokenInput(e.target.value)}
              required
              autoComplete="off"
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
            <div className="track-result__grid">
              <p>
                <span className="track-result__label">Order status</span>
                {order.status}
              </p>
              <p>
                <span className="track-result__label">Payment</span>
                {order.paymentStatus}
              </p>
              <p>
                <span className="track-result__label">Total</span>
                {formatCurrency(order.total)}
              </p>
            </div>

            {shipment ? (
              <ShipmentTimeline shipment={shipment} />
            ) : (
              <p className="track-result__pending">
                Shipment details are not available yet. Check back once your
                order has shipped.
              </p>
            )}

            <ul className="track-result__items">
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
