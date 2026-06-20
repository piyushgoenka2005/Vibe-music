"use client";

import { useMemo } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routes";
import { fetchProductSummaries, fetchProducts } from "@/services/products.api";
import { formatCurrency } from "@/utils/currency";
import { useCartStore } from "@/store/cartStore";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import type { Product } from "@/types/product";
import CartItem from "./CartItem";
import OrderSummary from "./OrderSummary";
import "./cart.css";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const isUpdating = useCartStore((s) => s.isUpdating);
  const recentlyViewedIds = useRecentlyViewedStore((s) => s.productIds);
  const isClient = useIsClient();

  const recentlyViewedKey = useMemo(
    () => recentlyViewedIds.slice(0, 12).join(","),
    [recentlyViewedIds]
  );

  const { data: recentlyViewed = [] } = useQuery({
    queryKey: ["cart-recently-viewed", recentlyViewedKey],
    queryFn: () => fetchProductSummaries(recentlyViewedIds.slice(0, 12)),
    enabled: isClient && recentlyViewedIds.length > 0,
    staleTime: 60_000,
  });

  const { data: recommended = [] } = useQuery({
    queryKey: ["cart-recommended"],
    queryFn: () => fetchProducts({ limit: 4 }),
    enabled: isClient,
    staleTime: 120_000,
  });

  if (!isClient) {
    return (
      <div className="cart-page" aria-busy="true">
        <div className="cart-skeleton-line" />
        <div className="cart-skeleton-line" />
        <div className="cart-skeleton-line" />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="storefront-page__header" style={{ marginBottom: "1.5rem" }}>
        <p className="storefront-page__eyebrow">Your bag</p>
        <h1 className="storefront-page__title">Cart</h1>
      </header>

      {items.length === 0 ? (
        <div className="cart-drawer__empty" style={{ padding: "48px 16px" }}>
          <p style={{ fontSize: 18, marginBottom: 16 }}>Your cart is empty.</p>
          <Link href={ROUTES.search} className="cart-btn cart-btn--primary" style={{ display: "inline-flex", width: "auto", padding: "0 32px" }}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-page__layout">
          <div>
            {isUpdating ? (
              <div className="cart-loading" role="status">
                <div className="cart-spinner" aria-hidden="true" />
                Updating cart...
              </div>
            ) : null}
            {items.map((item) => (
              <CartItem key={item.lineId} item={item} />
            ))}
          </div>
          <OrderSummary showCoupon />
        </div>
      )}

      {recentlyViewed.length > 0 ? (
        <section className="cart-page__section" aria-label="Recently viewed">
          <h2 className="cart-page__section-title">Recently Viewed</h2>
          <div className="cart-cross-sell">
            {recentlyViewed.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="cart-cross-sell__card"
              >
                <div
                  className="cart-cross-sell__swatch"
                  style={{ backgroundColor: product.imageColor }}
                />
                <div style={{ fontSize: 12, fontWeight: 700, color: "#807f7e" }}>
                  {product.brand}
                </div>
                <div style={{ fontSize: 14 }}>{product.name}</div>
                <div style={{ fontWeight: 700, color: "var(--brand-primary)" }}>
                  {formatCurrency(product.price)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {recommended.length > 0 ? (
        <section className="cart-page__section" aria-label="Recommended products">
          <h2 className="cart-page__section-title">Recommended for You</h2>
          <div className="cart-cross-sell">
            {recommended.map((product: Product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="cart-cross-sell__card"
              >
                <div
                  className="cart-cross-sell__swatch"
                  style={{ backgroundColor: product.imageColor }}
                />
                <div style={{ fontSize: 12, fontWeight: 700, color: "#807f7e" }}>
                  {product.brand}
                </div>
                <div style={{ fontSize: 14 }}>{product.name}</div>
                <div style={{ fontWeight: 700, color: "var(--brand-primary)" }}>
                  {formatCurrency(product.price)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
