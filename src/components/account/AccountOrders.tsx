"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import { fetchUserOrders } from "@/services/orderService";
import type { Order } from "@/types/order";
import AccountEmptyState from "./AccountEmptyState";
import {
  formatOrderDate,
  formatPaymentLabel,
  statusBadgeClass,
} from "./orderDisplay";

export default function AccountOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchUserOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load orders"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h2 className="acct__section-title">Orders</h2>
      <p className="acct__section-sub">
        Track, return, or buy things again.
      </p>

      <div className="acct__card">
        {loading ? (
          <p style={{ padding: 24, textAlign: "center", color: "#666" }}>
            Loading your orders...
          </p>
        ) : error ? (
          <p role="alert" style={{ padding: 24, color: "#c5221f" }}>
            {error}
          </p>
        ) : orders.length === 0 ? (
          <AccountEmptyState
            icon={ShoppingBag}
            title="No Orders Yet"
            description="When you place an order, it will appear here with tracking and status updates."
            actionLabel="Shop Now"
            actionHref={ROUTES.search}
          />
        ) : (
          orders.map((order) => (
            <div key={order.id} className="acct__order">
              <div>
                <p className="acct__order-id">Order #{order.id}</p>
                <p className="acct__order-meta">
                  {formatOrderDate(order.createdAt)} · {order.items.length} item
                  {order.items.length === 1 ? "" : "s"} ·{" "}
                  {formatPaymentLabel(order.paymentStatus)}
                </p>
              </div>
              <span className={statusBadgeClass(order.status)}>
                {order.status}
              </span>
              <div style={{ textAlign: "right" }}>
                <p className="acct__order-total">
                  {formatCurrency(order.total)}
                </p>
                <Link
                  href={`${ROUTES.checkoutSuccess}?orderId=${order.id}`}
                  className="acct__btn acct__btn--secondary acct__btn--sm"
                  style={{ marginTop: 8 }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
