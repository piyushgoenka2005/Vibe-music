"use client";

import { useLayoutEffect } from "react";
import {
  SPLASH_PENDING_CLASS,
  SPLASH_SEEN_KEY,
  isPageLoadSplashEnabled,
} from "@/components/layout/PageLoadSplash";

/**
 * Clears the SSR splash cover for return visitors without injecting <script>
 * tags (which React 19 / Next 16 warn about) or mutating React-owned nodes.
 */
export default function SplashPendingClear() {
  useLayoutEffect(() => {
    if (!isPageLoadSplashEnabled()) {
      document.documentElement.classList.remove(SPLASH_PENDING_CLASS);
      return;
    }
    try {
      if (sessionStorage.getItem(SPLASH_SEEN_KEY) === "1") {
        document.documentElement.classList.remove(SPLASH_PENDING_CLASS);
      }
    } catch {
      /* keep cover until PageLoadSplash decides */
    }
  }, []);

  return null;
}
