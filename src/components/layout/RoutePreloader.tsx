"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Lightweight routes only — heavy pages (e.g. /gp9) are excluded to avoid dev compile storms. */
const ROUTES_TO_PREFETCH =
  process.env.NODE_ENV === "production"
    ? ["/search", "/compare", "/wishlist", "/cart", "/account", "/deals", "/brands"]
    : [];

const PREFETCH_GAP_MS = 400;

export default function RoutePreloader() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || ROUTES_TO_PREFETCH.length === 0) return;

    let cancelled = false;
    let timer = 0;

    const schedule =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback.bind(window)
        : (cb: () => void) => window.setTimeout(cb, 1200);

    const prefetchTask = () => {
      let index = 0;

      const prefetchNext = () => {
        if (cancelled || index >= ROUTES_TO_PREFETCH.length) return;

        const route = ROUTES_TO_PREFETCH[index];
        index += 1;

        try {
          router.prefetch(route);
        } catch {
          /* prefetch failure is non-critical */
        }

        timer = window.setTimeout(prefetchNext, PREFETCH_GAP_MS);
      };

      prefetchNext();
    };

    const idleId = schedule(prefetchTask);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      if (typeof idleId === "number") {
        window.clearTimeout(idleId);
      } else if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [router]);

  return null;
}
