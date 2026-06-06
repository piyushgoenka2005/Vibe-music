"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import WishlistCounter from "./WishlistCounter";
import WishlistDrawer from "./WishlistDrawer";
import { useWishlistStore } from "@/store/wishlistStore";
import "./wishlist.css";

function WishlistNavMount() {
  const openDrawer = useWishlistStore((s) => s.openDrawer);
  return <WishlistCounter onClick={openDrawer} />;
}

export default function NavbarWishlist() {
  const rootRef = useRef<Root | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);

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

    function tryMount(): boolean {
      if (mountRef.current) return true;

      const cartWrap = document.querySelector(
        ".assets-site-header__menu-cart-wrap"
      );
      if (!cartWrap?.parentElement) return false;

      mountRef.current = document.createElement("div");
      mountRef.current.className = "wl-nav-mount";
      mountRef.current.setAttribute("data-vibe-wishlist", "true");
      cartWrap.parentElement.insertBefore(mountRef.current, cartWrap);
      rootRef.current = createRoot(mountRef.current);
      rootRef.current.render(<WishlistNavMount />);
      return true;
    }

    function onHeaderReady() {
      if (tryMount()) {
        stopWatching();
      }
    }

    onHeaderReady();
    if (mountRef.current) {
      return () => {
        const root = rootRef.current;
        const mountEl = mountRef.current;
        rootRef.current = null;
        mountRef.current = null;
        queueMicrotask(() => {
          root?.unmount();
          mountEl?.remove();
        });
      };
    }

    const header = document.querySelector('[data-sweetwater-section="header"]');
    if (header) {
      observer = new MutationObserver(onHeaderReady);
      observer.observe(header, { childList: true, subtree: true });
    }

    poll = window.setInterval(onHeaderReady, 300);

    return () => {
      stopWatching();
      const root = rootRef.current;
      const mountEl = mountRef.current;
      rootRef.current = null;
      mountRef.current = null;
      queueMicrotask(() => {
        root?.unmount();
        mountEl?.remove();
      });
    };
  }, []);

  return <WishlistDrawer />;
}
