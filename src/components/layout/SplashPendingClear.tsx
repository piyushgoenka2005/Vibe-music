"use client";

import { useLayoutEffect } from "react";
import { clearSplashCover } from "@/lib/splash/clearSplashCover";
import {
  SPLASH_ACTIVE_CLASS,
  SPLASH_CONTROLLER_ATTR,
  SPLASH_CONTROLLER_READY,
  SPLASH_PENDING_CLASS,
  SPLASH_SEEN_KEY,
  isPageLoadSplashEnabled,
} from "@/lib/splash/pageLoadSplash";

/**
 * Clears the SSR splash cover for return visitors without injecting <script>
 * tags (which React 19 / Next 16 warn about) or mutating React-owned nodes.
 */
export default function SplashPendingClear() {
  useLayoutEffect(() => {
    const clear = () => {
      clearSplashCover();
      document.documentElement.style.removeProperty("background");
      document.documentElement.style.removeProperty("background-color");
      document.body?.style.removeProperty("background");
      document.body?.style.removeProperty("background-color");
    };

    if (!isPageLoadSplashEnabled()) {
      clear();
      return;
    }
    try {
      if (sessionStorage.getItem(SPLASH_SEEN_KEY) === "1") {
        clear();
        return;
      }
    } catch {
      /* keep cover until PageLoadSplash decides */
    }

    // If React never hands off from the SSR boot overlay, unblock the storefront.
    const failsafeMs = 12_000;
    const failsafe = window.setTimeout(() => {
      const html = document.documentElement;
      if (html.getAttribute(SPLASH_CONTROLLER_ATTR) === SPLASH_CONTROLLER_READY) return;
      if (
        html.classList.contains(SPLASH_PENDING_CLASS) &&
        !html.classList.contains(SPLASH_ACTIVE_CLASS)
      ) {
        clearSplashCover(true);
      }
    }, failsafeMs);

    return () => window.clearTimeout(failsafe);
  }, []);

  return null;
}
