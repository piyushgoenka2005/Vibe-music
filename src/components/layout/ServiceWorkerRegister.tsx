"use client";

import { useEffect } from "react";

/**
 * Registers the storefront PWA service worker once in production (or when
 * NEXT_PUBLIC_ENABLE_PWA=true). Skips admin routes to avoid caching admin UI.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const enabled =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_ENABLE_PWA === "true";
    if (!enabled) return;

    if (window.location.pathname.startsWith("/admin")) return;

    let cancelled = false;

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) => {
        if (!cancelled) {
          console.warn("[pwa] Service worker registration failed:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
