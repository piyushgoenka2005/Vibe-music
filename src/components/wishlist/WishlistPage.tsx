"use client";

import { formatCurrency } from "@/utils/currency";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import "./wishlist.css";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const moveToCart = useWishlistStore((s) => s.moveToCart);
  const moveAllToCart = useWishlistStore((s) => s.moveAllToCart);
  const clear = useWishlistStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="wl-page">
      <h1 className="wl-page__title">My Wishlist</h1>
      <p className="wl-page__meta">
        {items.length} item{items.length === 1 ? "" : "s"}
        {user
          ? ` — synced with ${user.email}`
          : " — sign in to sync across devices"}
      </p>

      {items.length === 0 ? (
        <div className="wl-drawer__empty" style={{ border: "1px solid #e5e4e3", borderRadius: 3 }}>
          <p>Your wishlist is empty.</p>
          <Link href={ROUTES.search} style={{ color: "#0072ba", fontWeight: 700 }}>
            Browse categories
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <button type="button" className="wl-btn-primary" onClick={moveAllToCart}>
              Move All to Cart
            </button>
            <button type="button" className="wl-btn-secondary" onClick={clear}>
              Clear Wishlist
            </button>
          </div>

          <div className="wl-page__grid">
            {items.map((item) => (
              <article key={item.productId} className="wl-page__card">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="wl-drawer__photo"
                    style={{ width: 120, height: 120 }}
                  />
                ) : (
                  <div
                    className="wl-drawer__swatch"
                    style={{
                      backgroundColor: item.imageColor,
                      width: 120,
                      height: 120,
                    }}
                    aria-hidden="true"
                  />
                )}
                <div>
                  <div className="wl-drawer__brand">{item.brand}</div>
                  <Link href={`/product/${item.slug}`} className="wl-drawer__name">
                    {item.name}
                  </Link>
                  <div className="wl-drawer__price">{formatCurrency(item.price)}</div>
                </div>
                <div className="wl-page__card-actions wl-drawer__actions">
                  <button type="button" onClick={() => moveToCart(item.productId)}>
                    Move to Cart
                  </button>
                  <button type="button" onClick={() => remove(item.productId)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
