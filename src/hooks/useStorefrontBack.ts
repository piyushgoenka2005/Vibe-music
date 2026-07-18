"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  canGoStorefrontBack,
  currentStorefrontPath,
  defaultStorefrontBackHref,
  getPreviousStorefrontPath,
  markStorefrontBackIntent,
  rewindStorefrontStackTo,
} from "@/lib/navigation/storefrontHistory";

interface UseStorefrontBackOptions {
  /** Override fallback when there is no in-app history. */
  fallbackHref?: string;
}

function flushCurrentScroll(): void {
  if (typeof window === "undefined") return;
  try {
    const key = `${window.location.pathname}${window.location.search}`;
    const y = Math.max(
      0,
      Math.round(window.scrollY || document.documentElement.scrollTop || 0)
    );
    const raw = sessionStorage.getItem("vibe:scroll-positions");
    let positions: Record<string, number> = {};
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        positions = parsed as Record<string, number>;
      }
    }
    positions[key] = y;
    sessionStorage.setItem("vibe:scroll-positions", JSON.stringify(positions));
  } catch {
    /* ignore */
  }
}

export function useStorefrontBack(options: UseStorefrontBackOptions = {}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [canGoBack, setCanGoBack] = useState(false);

  const refresh = useCallback(() => {
    setCanGoBack(canGoStorefrontBack());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("vibe:nav-stack", refresh);
    window.addEventListener("popstate", refresh);
    return () => {
      window.removeEventListener("vibe:nav-stack", refresh);
      window.removeEventListener("popstate", refresh);
    };
  }, [pathname, refresh]);

  const fallbackHref =
    options.fallbackHref ?? defaultStorefrontBackHref(pathname);

  const goBack = useCallback(() => {
    flushCurrentScroll();

    const previous = getPreviousStorefrontPath();
    const current = currentStorefrontPath();

    if (previous && previous !== current) {
      // Navigate to the exact prior storefront URL (not browser history.back),
      // so filter replaces / soft-nav mismatches can't send the user elsewhere.
      rewindStorefrontStackTo(previous);
      markStorefrontBackIntent(previous);
      router.push(previous);
      return;
    }

    router.push(fallbackHref);
  }, [fallbackHref, router]);

  return { canGoBack, goBack, fallbackHref };
}
