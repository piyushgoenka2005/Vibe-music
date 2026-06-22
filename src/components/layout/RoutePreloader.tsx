"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES_TO_PREFETCH = [
  "/search",
  "/compare",
  "/wishlist",
  "/cart",
  "/account",
  "/deals",
  "/brands",
];

export default function RoutePreloader() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const idleCallback = typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback.bind(window)
      : (cb: () => void) => setTimeout(cb, 200);

    const prefetchTask = () => {
      for (const route of ROUTES_TO_PREFETCH) {
        try {
          router.prefetch(route);
        } catch {
          /* prefetch failure is non-critical */
        }
      }
    };

    idleCallback(prefetchTask);
  }, [router]);

  return null;
}
