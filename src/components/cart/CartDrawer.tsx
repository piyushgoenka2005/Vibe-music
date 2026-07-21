"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useCartDrawerA11y } from "@/hooks/useCartDrawerA11y";
import { useIsClient } from "@/hooks/useIsClient";
import { useCartStore } from "@/store/cartStore";
import { trackViewCart } from "@/lib/analytics/events";
import { cartItemsToAnalyticsLines } from "@/lib/analytics/cartLines";
import CartShell from "./CartShell";
import "./cart.css";

export default function CartDrawer() {
  const open = useCartStore((s) => s.drawerOpen);
  const items = useCartStore((s) => s.items);
  const close = useCartStore((s) => s.closeDrawer);
  const isClient = useIsClient();
  const drawerRef = useCartDrawerA11y(open, close);

  useEffect(() => {
    if (!open) return;
    trackViewCart(cartItemsToAnalyticsLines(items));
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!isClient || !open) return null;

  return createPortal(
    <>
      <div
        className="cart-drawer-overlay"
        onClick={close}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        className="cart-drawer cart-drawer--open"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <CartShell variant="drawer" onClose={close} onBrowse={close} />
      </aside>
    </>,
    document.body
  );
}
