"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackOrder } from "@/services/order.service";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import type { Order } from "@/types/order";

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
              onChange={(e) => setOrderIdInput(e.target.value)}
              required
              style={{ display: "block", width: "100%", marginTop: 4, padding: 10 }}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmailInput(e.target.value)}
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
            <h2>Order {order.id}</h2>
            <p>Status: {order.status}</p>
            <p>Payment: {order.paymentStatus}</p>
            <p>Total: {formatCurrency(order.total)}</p>
            <p>
              Deliver to: {order.shippingAddress.name},{" "}
              {order.shippingAddress.city}, {order.shippingAddress.state}
            </p>
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
