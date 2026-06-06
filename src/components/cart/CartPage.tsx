"use client";

import { useIsClient } from "@/hooks/useIsClient";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { PRODUCTS } from "@/data/products";
import { useCartStore } from "@/store/cartStore";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import CartItem from "./CartItem";
import OrderSummary from "./OrderSummary";
import "./cart.css";

const RECOMMENDED = PRODUCTS.slice(0, 4);

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const isUpdating = useCartStore((s) => s.isUpdating);
  const recentlyViewedIds = useRecentlyViewedStore((s) => s.productIds);
  const isClient = useIsClient();

  const recentlyViewed = recentlyViewedIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is (typeof PRODUCTS)[0] => Boolean(p));

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
      <h1 className="cart-page__title">Your Cart</h1>

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
              <CartItem key={item.productId} item={item} />
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
                <div style={{ fontWeight: 700, color: "#0072ba" }}>
                  ${product.price.toFixed(2)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="cart-page__section" aria-label="Recommended products">
        <h2 className="cart-page__section-title">Recommended for You</h2>
        <div className="cart-cross-sell">
          {RECOMMENDED.map((product) => (
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
              <div style={{ fontWeight: 700, color: "#0072ba" }}>
                ${product.price.toFixed(2)}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
