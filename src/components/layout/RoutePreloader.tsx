"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SPLASH_ACTIVE_CLASS } from "@/components/layout/PageLoadSplash";

/** High-intent routes only — avoid prefetch storms during LCP. */
const ROUTES_TO_PREFETCH =
  process.env.NODE_ENV === "production"
    ? ["/cart", "/search", "/account"]
    : [];

const PREFETCH_GAP_MS = 600;
const IDLE_TIMEOUT_MS = 8000;

function shouldDeferPrefetch(): boolean {
  if (typeof window === "undefined") return true;

  if (document.documentElement.classList.contains(SPLASH_ACTIVE_CLASS)) {
    return true;
  }

  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  if (connection?.saveData) return true;
  if (
    connection?.effectiveType &&
    /(?:2g|slow-2g)/i.test(connection.effectiveType)
  ) {
    return true;
  }

  return false;
}

export default function RoutePreloader() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || ROUTES_TO_PREFETCH.length === 0) {
      return;
    }

    let cancelled = false;
    let timer = 0;
    let idleId: number | ReturnType<typeof requestIdleCallback> = 0;

    const prefetchTask = () => {
      if (cancelled || shouldDeferPrefetch()) return;

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

    const schedulePrefetch = () => {
      if (cancelled) return;

      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(prefetchTask, {
          timeout: IDLE_TIMEOUT_MS,
        });
      } else {
        idleId = window.setTimeout(prefetchTask, IDLE_TIMEOUT_MS);
      }
    };

    if (document.readyState === "complete") {
      schedulePrefetch();
    } else {
      window.addEventListener("load", schedulePrefetch, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedulePrefetch);
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
