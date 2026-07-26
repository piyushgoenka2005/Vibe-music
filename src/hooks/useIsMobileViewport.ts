"use client";

import { useSyncExternalStore } from "react";

const MOBILE_VIEWPORT_QUERY = "(max-width: 767px)";
/** Matches CSS: hamburger visible / desktop category nav hidden */
const COMPACT_HEADER_QUERY = "(max-width: 1023px)";

function createMatchMediaStore(query: string) {
  function subscribe(onStoreChange: () => void) {
    const media = window.matchMedia(query);
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
  }

  function getSnapshot() {
    return window.matchMedia(query).matches;
  }

  function getServerSnapshot() {
    return false;
  }

  return { subscribe, getSnapshot, getServerSnapshot };
}

const mobileStore = createMatchMediaStore(MOBILE_VIEWPORT_QUERY);
const compactHeaderStore = createMatchMediaStore(COMPACT_HEADER_QUERY);

/** SSR-safe mobile viewport detection without hydration mismatches. */
export function useIsMobileViewport(): boolean {
  return useSyncExternalStore(
    mobileStore.subscribe,
    mobileStore.getSnapshot,
    mobileStore.getServerSnapshot
  );
}

/**
 * True when the header uses the hamburger drawer instead of the desktop
 * category strip (aligned with `@media (max-width: 1023px)` in site-layout).
 */
export function useIsCompactHeaderViewport(): boolean {
  return useSyncExternalStore(
    compactHeaderStore.subscribe,
    compactHeaderStore.getSnapshot,
    compactHeaderStore.getServerSnapshot
  );
}
