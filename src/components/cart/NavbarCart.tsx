"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import CartDrawer from "./CartDrawer";
import "./cart.css";

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
    if (cartCount.textContent !== text) {
      cartCount.textContent = text;
    }
    if (cartCount.getAttribute("data-count") !== dataCount) {
      cartCount.setAttribute("data-count", dataCount);
    }
  }

  if (cartLink && cartLink.getAttribute("aria-label") !== label) {
    cartLink.setAttribute("aria-label", label);
  }
}

function bindCartClick(): boolean {
  const cartLink = document.querySelector<HTMLAnchorElement>(
    ".assets-site-header__menu-cart"
  );
  if (!cartLink || cartLink.dataset.vibeCartBound === "true") {
    return Boolean(cartLink);
  }

  cartLink.dataset.vibeCartBound = "true";
  cartLink.href = "/cart";
  cartLink.addEventListener("click", (event) => {
    event.preventDefault();
    useCartStore.getState().openDrawer();
  });
  return true;
}

export default function NavbarCart() {
  const count = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  useEffect(() => {
    syncCartCount(count);
  }, [count]);

  useEffect(() => {
    let observer: MutationObserver | null = null;
    let poll: number | null = null;

    function stopWatching() {
      observer?.disconnect();
      observer = null;
      if (poll !== null) {
        window.clearInterval(poll);
        poll = null;
      }
    }

    function tryBind() {
      if (bindCartClick()) {
        stopWatching();
        return true;
      }
      return false;
    }

    if (tryBind()) {
      return;
    }

    const header = document.querySelector('[data-sweetwater-section="header"]');
    if (header) {
      observer = new MutationObserver(tryBind);
      observer.observe(header, { childList: true, subtree: true });
    }

    poll = window.setInterval(tryBind, 300);

    return () => {
      stopWatching();
    };
  }, []);

  return <CartDrawer />;
}
