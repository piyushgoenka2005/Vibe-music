"use client";

import { useLayoutEffect } from "react";
import {
  SPLASH_ACTIVE_CLASS,
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
    const clear = () => {
      document.documentElement.classList.remove(
        SPLASH_PENDING_CLASS,
        SPLASH_ACTIVE_CLASS
      );
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
      }
    } catch {
      /* keep cover until PageLoadSplash decides */
    }
  }, []);

  return null;
}
