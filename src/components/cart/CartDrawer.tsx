"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { createPortal } from "react-dom";
import { useIsClient } from "@/hooks/useIsClient";
import { useCartStore } from "@/store/cartStore";
import CartItem from "./CartItem";
import OrderSummary from "./OrderSummary";
import "./cart.css";

export default function CartDrawer() {
  const open = useCartStore((s) => s.drawerOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const isUpdating = useCartStore((s) => s.isUpdating);
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

  if (!isClient || !open) return null;

  return createPortal(
    <>
      <div
        className="cart-drawer-overlay"
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className="cart-drawer cart-drawer--open"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">
            Your Cart ({items.reduce((s, i) => s + i.quantity, 0)})
          </h2>
          <button type="button" className="cart-drawer__close" onClick={close}>
            Close
          </button>
        </div>

        <div className="cart-drawer__body">
          {isUpdating ? (
            <div className="cart-loading" role="status" aria-live="polite">
              <div className="cart-spinner" aria-hidden="true" />
              Updating cart...
            </div>
          ) : null}

          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <p>Your cart is empty.</p>
              <Link
                href={ROUTES.search}
                style={{ color: "var(--brand-primary)", fontWeight: 700 }}
                onClick={close}
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <CartItem key={item.lineId} item={item} compact />
            ))
          )}
        </div>

        {items.length > 0 ? (
          <div className="cart-drawer__footer">
            <OrderSummary showCoupon={false} compact />
          </div>
        ) : null}
      </aside>
    </>,
    document.body
  );
}
