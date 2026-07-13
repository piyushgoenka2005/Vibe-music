"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Heart,
  MapPin,
  ShoppingBag,
  ArrowRight,
  Bell,
  Headset,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAddresses } from "@/hooks/useAddresses";
import { formatCurrency, formatDisplayPrice } from "@/utils/currency";
import { fetchUserOrders } from "@/services/orderService";
import type { Order } from "@/types/order";
import {
  formatOrderDate,
  formatPaymentLabel,
  statusBadgeClass,
} from "./orderDisplay";

const RECENT_ORDERS_LIMIT = 3;

export default function AccountOverview() {
  const user = useAuthStore((s) => s.user);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const wishlistItems = useWishlistStore((s) => s.items);
  const { addresses, isLoading: addressesLoading } = useAddresses();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchUserOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const orderCount = orders.length;
  const recentOrders = orders.slice(0, RECENT_ORDERS_LIMIT);

  const stats = [
    {
      href: ROUTES.accountOrders,
      label: "Orders",
      value: ordersLoading ? "…" : orderCount,
      icon: Package,
      variant: "blue" as const,
    },
    {
      href: ROUTES.accountWishlist,
      label: "Wishlist",
      value: wishlistCount,
      icon: Heart,
      variant: "red" as const,
    },
    {
      href: ROUTES.accountAddresses,
      label: "Saved Addresses",
      value: addressesLoading ? "…" : addresses.length,
      icon: MapPin,
      variant: "green" as const,
    },
    {
      href: ROUTES.accountNotifications,
      label: "Notifications",
      value: "Inbox",
      icon: Bell,
      variant: "purple" as const,
    },
  ];

  return (
    <div>
      <h2 className="acct__section-title">Dashboard</h2>
      <p className="acct__section-sub">
        Welcome back{user?.name ? `, ${user.name}` : ""}. Here&apos;s your account at a glance.
      </p>

      <div className="acct__stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="acct__stat-card">
              <div className={`acct__stat-icon acct__stat-icon--${stat.variant}`}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <p className="acct__stat-label">{stat.label}</p>
              <p className="acct__stat-value">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="acct__stats" style={{ marginTop: "1.5rem" }}>
        <Link href={ROUTES.accountNotifications} className="acct__stat-card">
          <div className="acct__stat-icon acct__stat-icon--blue">
            <Bell size={20} strokeWidth={2} />
          </div>
          <p className="acct__stat-label">Notifications</p>
          <p className="acct__stat-value" style={{ fontSize: "0.875rem" }}>
            View inbox
          </p>
        </Link>
        <Link href={ROUTES.accountSupport} className="acct__stat-card">
          <div className="acct__stat-icon acct__stat-icon--green">
            <Headset size={20} strokeWidth={2} />
          </div>
          <p className="acct__stat-label">Support</p>
          <p className="acct__stat-value" style={{ fontSize: "0.875rem" }}>
            Your tickets
          </p>
        </Link>
      </div>

      <div className="acct__grid-2">
        <section className="acct__card">
          <div className="acct__card-header">
            <h3 className="acct__card-title">Recent Orders</h3>
            <Link href={ROUTES.accountOrders} className="acct__card-link">
              View all
            </Link>
          </div>
          <div className="acct__card-body">
            {ordersLoading ? (
              <p style={{ padding: 32, textAlign: "center", color: "#666" }}>
                Loading orders...
              </p>
            ) : recentOrders.length === 0 ? (
              <div className="acct__empty" style={{ padding: "32px 16px" }}>
                <div className="acct__empty-icon">
                  <ShoppingBag size={32} strokeWidth={1.5} />
                </div>
                <h3 className="acct__empty-title" style={{ fontSize: 16 }}>
                  No orders yet
                </h3>
                <p className="acct__empty-text" style={{ marginBottom: 16 }}>
                  Your purchase history will appear here.
                </p>
                <Link href={ROUTES.search} className="acct__btn acct__btn--primary acct__btn--sm">
                  Shop Now
                </Link>
              </div>
            ) : (
              recentOrders.map((order) => (
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
                      href={ROUTES.accountOrder(order.id)}
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
        </section>

        <section className="acct__card">
          <div className="acct__card-header">
            <h3 className="acct__card-title">Wishlist Preview</h3>
            <Link href={ROUTES.accountWishlist} className="acct__card-link">
              View all <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
            </Link>
          </div>
          <div className="acct__card-body">
            {wishlistItems.length === 0 ? (
              <div className="acct__empty" style={{ padding: "32px 16px" }}>
                <div className="acct__empty-icon">
                  <Heart size={32} strokeWidth={1.5} />
                </div>
                <h3 className="acct__empty-title" style={{ fontSize: 16 }}>
                  Wishlist is empty
                </h3>
                <p className="acct__empty-text" style={{ marginBottom: 16 }}>
                  Save gear you love for later.
                </p>
                <Link href={ROUTES.search} className="acct__btn acct__btn--primary acct__btn--sm">
                  Browse Products
                </Link>
              </div>
            ) : (
              <ul className="acct__preview-list">
                {wishlistItems.slice(0, 4).map((item) => (
                  <li key={item.productId} className="acct__preview-item">
                    <div className="acct__preview-thumb">
                      {item.image ? (
                        <img src={item.image} alt="" />
                      ) : (
                        <div
                          className="acct__wishlist-swatch"
                          style={{ backgroundColor: item.imageColor }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        href={`/product/${item.slug}`}
                        className="acct__preview-name"
                      >
                        {item.name}
                      </Link>
                      <span className="acct__preview-price">
                        {formatDisplayPrice(item.price)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
