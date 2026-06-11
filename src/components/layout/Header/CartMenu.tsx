"use client";

import { useEffect } from "react";
import MarkupBlock from "./MarkupBlock";
import { CART_MENU_MARKUP, NAV_TOGGLE_MARKUP } from "./generated/markup";
import CartDrawer from "@/components/cart/CartDrawer";
import { useCartStore } from "@/store/cartStore";
import "@/components/cart/cart.css";

function syncCartCount(count: number) {
  const cartCount = document.querySelector(
    ".assets-site-header__menu-cart-count"
  );
  const cartLink = document.querySelector<HTMLAnchorElement>(
    ".assets-site-header__menu-cart"
  );

  const text = count > 0 ? String(count) : "";
  const dataCount = count > 99 ? "99+" : String(count);
  const label =
    count === 0
      ? "No items in your cart"
      : `${count} item${count === 1 ? "" : "s"} in your cart`;

  if (cartCount) {
    if (cartCount.textContent !== text) cartCount.textContent = text;
    if (cartCount.getAttribute("data-count") !== dataCount) {
      cartCount.setAttribute("data-count", dataCount);
    }
  }

  if (cartLink && cartLink.getAttribute("aria-label") !== label) {
    cartLink.setAttribute("aria-label", label);
  }
}

export default function CartMenu() {
  const count = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const openDrawer = useCartStore((s) => s.openDrawer);

  useEffect(() => {
    syncCartCount(count);
  }, [count]);

  useEffect(() => {
    const cartLink = document.querySelector<HTMLAnchorElement>(
      ".assets-site-header__menu-cart"
    );
    if (!cartLink) return;

    const onClick = (event: Event) => {
      event.preventDefault();
      openDrawer();
    };

    cartLink.href = "/cart";
    cartLink.addEventListener("click", onClick);
    return () => cartLink.removeEventListener("click", onClick);
  }, [openDrawer]);

  return (
    <>
      <MarkupBlock html={CART_MENU_MARKUP} />
      <MarkupBlock html={NAV_TOGGLE_MARKUP} />
      <CartDrawer />
    </>
  );
}
