"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import {
  isInvoiceAvailable,
  withInvoiceReturnTo,
} from "@/features/invoice/utils/invoice-utils";
import { useUserOrders } from "@/hooks/useUserOrders";
import AccountEmptyState from "./AccountEmptyState";
import {
  formatOrderDate,
  formatPaymentLabel,
  statusBadgeClass,
} from "./orderDisplay";

export default function AccountOrders() {
  const { data: orders = [], isLoading, error } = useUserOrders();

  return (
    <div>
      <h2 className="acct__section-title">Orders</h2>
      <p className="acct__section-sub">
        Track, return, or buy things again.
      </p>

      <div className="acct__card">
        {isLoading ? (
          <p style={{ padding: 24, textAlign: "center", color: "#666" }}>
            Loading your orders...
          </p>
        ) : error ? (
          <p role="alert" style={{ padding: 24, color: "#c5221f" }}>
            {error instanceof Error ? error.message : "Unable to load orders"}
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
                  href={
                    order.trackingToken
                      ? `${ROUTES.trackOrder}?orderId=${encodeURIComponent(order.id)}&trackingToken=${encodeURIComponent(order.trackingToken)}`
                      : `${ROUTES.trackOrder}?orderId=${encodeURIComponent(order.id)}`
                  }
                  className="acct__btn acct__btn--secondary acct__btn--sm"
                  style={{ marginTop: 8, marginRight: 8 }}
                >
                  Track shipment
                </Link>
                <Link
                  href={ROUTES.accountOrder(order.id)}
                  className="acct__btn acct__btn--secondary acct__btn--sm"
                  style={{ marginTop: 8 }}
                >
                  View Details
                </Link>
              </div>

              {isInvoiceAvailable(order) ? (
                <Link
                  href={withInvoiceReturnTo(
                    `/orders/${order.id}/invoice`,
                    ROUTES.accountOrders
                  )}
                  className="acct__btn acct__btn--secondary acct__btn--sm"
                  style={{ marginTop: 8 }}
                >
                  View invoice
                </Link>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
