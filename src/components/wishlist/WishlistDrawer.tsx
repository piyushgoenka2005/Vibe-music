"use client";

import { formatDisplayPrice } from "@/utils/currency";

import { useEffect } from "react";
import Link from "next/link";
import ProductShareButton from "@/components/product/ProductShareButton";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import WishlistEmptyState from "@/components/wishlist/WishlistEmptyState";
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
            <WishlistEmptyState onBrowse={close} />
          ) : (
            items.map((item) => (
              <div key={item.productId} className="wl-drawer__item">
                {item.image ? (
                  <StorefrontThumbImage
                    src={item.image}
                    className="wl-drawer__photo"
                    width={64}
                    height={64}
                  />
                ) : (
                  <div
                    className="wl-drawer__swatch"
                    style={{ backgroundColor: item.imageColor }}
                    aria-hidden="true"
                  />
                )}
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
                    {formatDisplayPrice(item.price)}
                  </div>
                  <div className="wl-drawer__actions">
                    <button
                      type="button"
                      className="wl-drawer__action-btn wl-drawer__action-btn--primary"
                      onClick={() => moveToCart(item.productId)}
                    >
                      Move to Cart
                    </button>
                    <ProductShareButton
                      className="wl-drawer__share-btn"
                      title={`${item.brand} ${item.name}`}
                      url={`/product/${item.slug}`}
                      size={15}
                    />
                    <button
                      type="button"
                      className="wl-drawer__action-btn"
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
