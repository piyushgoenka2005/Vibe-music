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
      (process.env.NODE_ENV === "production" ||
        process.env.NEXT_PUBLIC_ENABLE_PWA === "true") &&
      process.env.NEXT_PUBLIC_ENABLE_PWA !== "false";
    if (!enabled) return;

    if (window.location.pathname.startsWith("/admin")) return;

    let cancelled = false;
    let idleId: number | ReturnType<typeof requestIdleCallback> = 0;

    const register = () => {
      if (cancelled) return;
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) => {
          if (!cancelled) {
            console.warn("[pwa] Service worker registration failed:", error);
          }
        });
    };

    const scheduleRegister = () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(register, { timeout: 5000 });
      } else {
        idleId = window.setTimeout(register, 5000);
      }
    };

    if (document.readyState === "complete") {
      scheduleRegister();
    } else {
      window.addEventListener("load", scheduleRegister, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleRegister);
      if (typeof idleId === "number") {
        window.clearTimeout(idleId);
      } else if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  return null;
}
