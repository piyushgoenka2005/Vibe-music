"use client";

import { useSyncExternalStore } from "react";

const MOBILE_VIEWPORT_QUERY = "(max-width: 767px)";

function subscribeMobileViewport(onStoreChange: () => void) {
  const media = window.matchMedia(MOBILE_VIEWPORT_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getMobileViewportSnapshot() {
  return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
}

function getMobileViewportServerSnapshot() {
  return false;
}

/** SSR-safe mobile viewport detection without hydration mismatches. */
export function useIsMobileViewport(): boolean {
  return useSyncExternalStore(
    subscribeMobileViewport,
    getMobileViewportSnapshot,
    getMobileViewportServerSnapshot
  );
}
