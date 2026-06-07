"use client";

import { useState } from "react";
import Link from "next/link";
import HtmlSection from "@/components/vibe/HtmlSection";
import { trackOrder } from "@/services/order.service";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import type { Order } from "@/types/order";

export default function TrackingPageContent() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
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
    <>
      <main className="homepage-wrapper" id="main-content">
        <section style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          <h1>Track your order</h1>
          <p style={{ color: "#807f7e" }}>
            Enter your order ID and the email used at checkout.
          </p>
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <label>
              Order ID
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                style={{ display: "block", width: "100%", marginTop: 4, padding: 10 }}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ display: "block", width: "100%", marginTop: 4, padding: 10 }}
              />
            </label>
            <button type="submit" className="sw-btn sw-btn-blue" disabled={loading}>
              {loading ? "Looking up..." : "Track order"}
            </button>
          </form>
          {error ? (
            <p role="alert" style={{ color: "#c41e3a", marginTop: 16 }}>
              {error}
            </p>
          ) : null}
          {order ? (
            <div
              style={{
                marginTop: 24,
                border: "1px solid #d9d9d9",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <h2>Order #{order.id.slice(0, 8)}</h2>
              <p>Status: {order.status}</p>
              <p>Total: {formatCurrency(order.total)}</p>
              <ul>
                {order.items.map((item) => (
                  <li key={item.productId}>
                    {item.quantity} × {item.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p style={{ marginTop: 24 }}>
            <Link href={ROUTES.accountOrders}>View account orders</Link>
          </p>
        </section>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
