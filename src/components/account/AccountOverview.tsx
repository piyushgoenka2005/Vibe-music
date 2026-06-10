"use client";

import Link from "next/link";
import {
  Package,
  Heart,
  MapPin,
  Star,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAccountProfileStore } from "@/store/accountProfileStore";
import { formatCurrency } from "@/utils/currency";

export default function AccountOverview() {
  const user = useAuthStore((s) => s.user);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const wishlistItems = useWishlistStore((s) => s.items);
  const addresses = useAccountProfileStore((s) => s.addresses);

  const orderCount = 0;
  const rewardPoints = wishlistCount * 25 + addresses.length * 50;

  const stats = [
    {
      href: ROUTES.accountOrders,
      label: "Orders",
      value: orderCount,
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
      value: addresses.length,
      icon: MapPin,
      variant: "green" as const,
    },
    {
      href: ROUTES.accountSettings,
      label: "Reward Points",
      value: rewardPoints,
      icon: Star,
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

      <div className="acct__grid-2">
        <section className="acct__card">
          <div className="acct__card-header">
            <h3 className="acct__card-title">Recent Orders</h3>
            <Link href={ROUTES.accountOrders} className="acct__card-link">
              View all
            </Link>
          </div>
          <div className="acct__card-body">
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
                        {formatCurrency(item.price)}
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
