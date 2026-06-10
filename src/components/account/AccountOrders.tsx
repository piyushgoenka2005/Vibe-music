"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import type { Order, OrderStatus } from "@/types/order";
import AccountEmptyState from "./AccountEmptyState";

function statusBadgeClass(status: OrderStatus): string {
  return `acct__badge acct__badge--${status}`;
}

function formatOrderDate(date?: string): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface AccountOrdersProps {
  orders?: Order[];
}

export default function AccountOrders({ orders = [] }: AccountOrdersProps) {
  return (
    <div>
      <h2 className="acct__section-title">Orders</h2>
      <p className="acct__section-sub">
        Track, return, or buy things again.
      </p>

      <div className="acct__card">
        {orders.length === 0 ? (
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
                  {order.items.length === 1 ? "" : "s"}
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
                  href={`${ROUTES.accountOrders}?id=${order.id}`}
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
