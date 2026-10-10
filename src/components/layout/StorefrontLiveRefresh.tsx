"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const POLL_MS = 30_000;
/** Pages with in-progress forms — a server refresh there could reset what the shopper is typing. */
const SKIP_PATHS = /^\/(admin|checkout|login|register|forgot-password|reset-password)(\/|$)/;

/**
 * Picks up admin changes in already-open tabs: when the storefront version moves,
 * `router.refresh()` re-renders server data in place (client state is kept) and
 * clears the client router cache so later navigations are fresh too.
 */
export default function StorefrontLiveRefresh() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const skip = SKIP_PATHS.test(pathname);
  const versionRef = useRef<number | null>(null);

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    let inFlight = false;

    const check = async () => {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const response = await fetch("/api/storefront/version", { cache: "no-store" });
        if (!response.ok) return;
        const { v } = (await response.json()) as { v?: unknown };
        if (cancelled || typeof v !== "number") return;
        if (versionRef.current !== null && v !== versionRef.current) {
          router.refresh();
        }
        versionRef.current = v;
      } catch {
        /* offline or navigating away */
      } finally {
        inFlight = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };

    void check();
    const timer = window.setInterval(() => void check(), POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router, skip]);

  return null;
}
