"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/useIsClient";
import { useWishlistStore } from "@/store/wishlistStore";
import "./wishlist.css";

export default function WishlistDrawer() {
  const open = useWishlistStore((s) => s.drawerOpen);
  const close = useWishlistStore((s) => s.closeDrawer);
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const moveToCart = useWishlistStore((s) => s.moveToCart);
  const moveAllToCart = useWishlistStore((s) => s.moveAllToCart);
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (open) document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open, close]);

  if (!isClient) return null;
  if (!open) return null;

  return createPortal(
    <>
      <div className="wl-drawer-overlay" onClick={close} aria-hidden="true" />
      <aside
        className="wl-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
      >
        <div className="wl-drawer__header">
          <h2 className="wl-drawer__title">
            Wishlist ({items.length})
          </h2>
          <button type="button" className="wl-drawer__close" onClick={close}>
            Close
          </button>
        </div>

        <div className="wl-drawer__body">
          {items.length === 0 ? (
            <div className="wl-drawer__empty">
              <p>Your wishlist is empty.</p>
              <p style={{ fontSize: 14 }}>
                Save items you love and come back anytime.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="wl-drawer__item">
                <div
                  className="wl-drawer__swatch"
                  style={{ backgroundColor: item.imageColor }}
                  aria-hidden="true"
                />
                <div>
                  <div className="wl-drawer__brand">{item.brand}</div>
                  <Link
                    href={`/product/${item.slug}`}
                    className="wl-drawer__name"
                    onClick={close}
                  >
                    {item.name}
                  </Link>
                  <div className="wl-drawer__price">
                    ${item.price.toFixed(2)}
                  </div>
                  <div className="wl-drawer__actions">
                    <button
                      type="button"
                      onClick={() => moveToCart(item.productId)}
                    >
                      Move to Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 ? (
          <div className="wl-drawer__footer">
            <button
              type="button"
              className="wl-btn-primary"
              onClick={moveAllToCart}
            >
              Move All to Cart
            </button>
            <Link href={ROUTES.accountWishlist} className="wl-btn-secondary" onClick={close}>
              View Full Wishlist
            </Link>
          </div>
        ) : null}
      </aside>
    </>,
    document.body
  );
}
