"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  consumeStorefrontBackIntent,
  getStorefrontNavStackPaths,
  recordStorefrontNavigation,
} from "@/lib/navigation/storefrontHistory";
import {
  HEIGHT_STABLE_MS,
  RESTORE_WINDOW_MS,
  SCROLL_POSITIONS_KEY,
  shouldCancelRestoreForUserScroll,
  shouldPersistScrollWhileRestoring,
  shouldTreatAsBackNavigation,
  updateHistoryStack,
} from "@/lib/navigation/scrollRestore";

/** Set synchronously in capture phase before React / Next handle popstate. */
let pendingPopNavigation = false;

if (typeof window !== "undefined") {
  window.addEventListener(
    "popstate",
    () => {
      pendingPopNavigation = true;
    },
    true
  );
}

function readPositions(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(SCROLL_POSITIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, number>;
  } catch {
    return {};
  }
}

function writePositions(positions: Record<string, number>) {
  try {
    sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
  } catch {
    /* quota / private mode */
  }
}

function pathKey(pathname: string): string {
  if (typeof window === "undefined") return pathname;
  return `${pathname}${window.location.search}`;
}

function applyScrollY(y: number) {
  window.scrollTo({ top: y, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = y;
  document.body.scrollTop = y;
}

function saveScrollForKey(key: string, y: number) {
  const positions = readPositions();
  positions[key] = Math.max(0, Math.round(y));
  writePositions(positions);
}

function runScrollRestore(targetY: number) {
  let stopped = false;
  let resizeObserver: ResizeObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let timeoutId = 0;
  let stableTimeoutId = 0;
  let lastHeight = 0;
  let heightStableSince = 0;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    if (timeoutId) window.clearTimeout(timeoutId);
    if (stableTimeoutId) window.clearTimeout(stableTimeoutId);
    window.removeEventListener("wheel", onUserGesture, true);
    window.removeEventListener("touchstart", onUserGesture, true);
    window.removeEventListener("keydown", onUserGesture, true);
    window.removeEventListener("scroll", onScrollCheck, true);
  };

  const restore = () => {
    if (stopped) return;
    applyScrollY(targetY);
  };

  const onScrollCheck = () => {
    if (stopped) return;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    // Ignore Next/App Router forcing scroll to ~0 during restore.
    if (y <= 2) {
      restore();
      return;
    }
    if (shouldCancelRestoreForUserScroll(y, targetY)) {
      stop();
    }
  };

  const onUserGesture = () => {
    if (stopped) return;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    // Accidental touch during load: re-apply unless user clearly moved away.
    if (shouldCancelRestoreForUserScroll(y, targetY)) {
      stop();
      return;
    }
    restore();
  };

  const noteHeight = () => {
    if (stopped) return;
    const height = document.documentElement.scrollHeight;
    if (height !== lastHeight) {
      lastHeight = height;
      heightStableSince = Date.now();
      restore();
      if (stableTimeoutId) window.clearTimeout(stableTimeoutId);
      stableTimeoutId = window.setTimeout(() => {
        if (stopped) return;
        if (Date.now() - heightStableSince >= HEIGHT_STABLE_MS) {
          restore();
        }
      }, HEIGHT_STABLE_MS);
    } else {
      restore();
    }
  };

  restore();
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });

  lastHeight = document.documentElement.scrollHeight;
  heightStableSince = Date.now();

  resizeObserver = new ResizeObserver(() => {
    noteHeight();
  });
  resizeObserver.observe(document.documentElement);
  if (document.body) {
    resizeObserver.observe(document.body);
  }

  mutationObserver = new MutationObserver(() => {
    noteHeight();
  });
  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("wheel", onUserGesture, { passive: true, capture: true });
  window.addEventListener("touchstart", onUserGesture, {
    passive: true,
    capture: true,
  });
  window.addEventListener("keydown", onUserGesture, true);
  window.addEventListener("scroll", onScrollCheck, { passive: true, capture: true });
  timeoutId = window.setTimeout(stop, RESTORE_WINDOW_MS);

  return stop;
}

/**
 * App Router + async homepage sections often restore scroll before layout
 * height exists, so Back lands at the hero. Manual restore keeps re-applying
 * the saved Y until the page height settles (or the user scrolls away).
 */
export default function ScrollRestoration() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";
  const prevKeyRef = useRef<string | null>(null);
  const historyStackRef = useRef<string[]>([]);
  const stackSeededRef = useRef(false);
  const restoringRef = useRef(false);
  /** Frozen restore target — survives storage corruption during restore. */
  const restoreTargetYRef = useRef(0);
  /** Last known scroll for the active key — survives Next scrolling to 0 mid-nav. */
  const lastYRef = useRef(0);
  const activeKeyRef = useRef(pathKey(pathname));

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const key = pathKey(pathname);
    activeKeyRef.current = key;
    if (!restoringRef.current) {
      lastYRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    }

    let ticking = false;

    const persistFromWindow = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      if (!restoringRef.current) {
        lastYRef.current = y;
      }
      if (!shouldPersistScrollWhileRestoring(restoringRef.current)) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!shouldPersistScrollWhileRestoring(restoringRef.current)) return;
        saveScrollForKey(activeKeyRef.current, lastYRef.current);
      });
    };

    const flushBeforeNav = () => {
      if (!shouldPersistScrollWhileRestoring(restoringRef.current)) return;
      saveScrollForKey(activeKeyRef.current, lastYRef.current);
    };

    window.addEventListener("scroll", persistFromWindow, { passive: true });
    window.addEventListener("pagehide", flushBeforeNav);
    document.addEventListener("pointerdown", flushBeforeNav, true);
    document.addEventListener("keydown", flushBeforeNav, true);

    return () => {
      window.removeEventListener("scroll", persistFromWindow);
      window.removeEventListener("pagehide", flushBeforeNav);
      document.removeEventListener("pointerdown", flushBeforeNav, true);
      document.removeEventListener("keydown", flushBeforeNav, true);
      if (shouldPersistScrollWhileRestoring(restoringRef.current)) {
        saveScrollForKey(key, lastYRef.current);
      }
    };
  }, [pathname, searchKey]);

  useLayoutEffect(() => {
    const key = pathKey(pathname);
    const prevKey = prevKeyRef.current;
    prevKeyRef.current = key;

    if (!stackSeededRef.current) {
      const seeded = getStorefrontNavStackPaths();
      if (seeded.length > 0) {
        historyStackRef.current = seeded;
      }
      stackSeededRef.current = true;
    }

    const stack = historyStackRef.current;
    const pendingPop = pendingPopNavigation;
    pendingPopNavigation = false;

    const intentionalBack = consumeStorefrontBackIntent(key);
    const savedY = readPositions()[key];
    const isBack = shouldTreatAsBackNavigation({
      intentionalBack,
      key,
      stack,
      pendingPop,
      savedY,
    });
    historyStackRef.current = updateHistoryStack(stack, key, isBack);
    recordStorefrontNavigation(key, isBack);

    const shouldRestore =
      isBack &&
      savedY != null &&
      savedY > 0 &&
      (intentionalBack || pendingPop || prevKey === null || prevKey !== key);

    if (shouldRestore) {
      restoringRef.current = true;
      restoreTargetYRef.current = savedY;
      const stop = runScrollRestore(savedY);
      return () => {
        restoringRef.current = false;
        restoreTargetYRef.current = 0;
        stop();
      };
    }

    restoringRef.current = false;
    restoreTargetYRef.current = 0;

    if (prevKey !== null && prevKey !== key && !isBack) {
      applyScrollY(0);
      lastYRef.current = 0;
    }

    return undefined;
  }, [pathname, searchKey]);

  /** Next may scroll to top after layout — re-apply frozen target while restoring. */
  useEffect(() => {
    if (!restoringRef.current) return undefined;

    const targetY = restoreTargetYRef.current;
    if (targetY <= 0) return undefined;

    let frame = 0;
    let rafId = 0;

    const tick = () => {
      applyScrollY(targetY);
      frame += 1;
      if (frame < 20 && restoringRef.current) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [pathname, searchKey]);

  return null;
}
