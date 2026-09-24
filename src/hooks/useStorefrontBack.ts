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
import {
  SCROLL_ANCHORS_KEY,
  SCROLL_POSITIONS_KEY,
  persistStorefrontScroll,
  readScrollPositions,
} from "@/lib/navigation/scrollRestore";

interface UseStorefrontBackOptions {
  /** Override fallback when there is no in-app history. */
  fallbackHref?: string;
}

function flushCurrentScroll(): void {
  if (typeof window === "undefined") return;
  try {
    const key = `${window.location.pathname}${window.location.search}`;
    const liveY = Math.max(
      0,
      Math.round(window.scrollY || document.documentElement.scrollTop || 0),
    );
    const positionsRaw = sessionStorage.getItem(SCROLL_POSITIONS_KEY);
    const anchorsRaw = sessionStorage.getItem(SCROLL_ANCHORS_KEY);
    const previous = readScrollPositions(positionsRaw)[key] ?? 0;
    const lastKnown = Math.max(previous, liveY);
    persistStorefrontScroll({
      key,
      liveY,
      lastKnownY: lastKnown,
      navGuardActive: liveY <= 2 && previous > 48,
      positionsRaw,
      anchorsRaw,
    });
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

  const fallbackHref = options.fallbackHref ?? defaultStorefrontBackHref(pathname);

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
