"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AccountNav from "@/components/account/AccountNav";
import { getOrdersForUser } from "@/services/order.service";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/routes";
import type { Order } from "@/types/order";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function AccountOrdersContent() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    getOrdersForUser(user.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <section
      className="personalization-widgets"
      style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}
    >
      <h2 className="personalization-widgets__greeting">Order History</h2>
      <AccountNav active={ROUTES.accountOrders} />
      {loading ? (
        <p style={{ color: "#807f7e" }}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: "#807f7e" }}>
          You have no orders yet. Items you purchase will appear here.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {orders.map((order) => (
            <li
              key={order.id}
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <strong>Order #{order.id.slice(0, 8)}</strong>
                  <div style={{ color: "#807f7e", fontSize: 14 }}>
                    {new Date(order.createdAt).toLocaleDateString()} · {order.status}
                  </div>
                </div>
                <div>{formatPrice(order.total)}</div>
              </div>
              <Link href={ROUTES.tracking} style={{ fontSize: 14 }}>
                Track this order
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
