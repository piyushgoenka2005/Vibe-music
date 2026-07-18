"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  consumeStorefrontBackIntent,
  recordStorefrontNavigation,
} from "@/lib/navigation/storefrontHistory";

const STORAGE_KEY = "vibe:scroll-positions";
/** Re-apply saved Y while homepage chunks / images expand after back. */
const RESTORE_WINDOW_MS = 2800;

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
    const raw = sessionStorage.getItem(STORAGE_KEY);
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
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
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

function isBackToKey(key: string, stack: string[], pendingPop: boolean): boolean {
  const index = stack.lastIndexOf(key);
  if (pendingPop) {
    // Browser back/forward: only treat as back when this URL already exists earlier.
    return index !== -1;
  }
  return index !== -1 && index < stack.length - 1;
}

function updateHistoryStack(stack: string[], key: string, isBack: boolean): string[] {
  if (isBack) {
    const index = stack.lastIndexOf(key);
    return index === -1 ? stack : stack.slice(0, index + 1);
  }
  if (stack[stack.length - 1] === key) return stack;
  return [...stack, key];
}

function runScrollRestore(targetY: number) {
  let stopped = false;
  let observer: ResizeObserver | null = null;
  let timeoutId = 0;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    observer?.disconnect();
    if (timeoutId) window.clearTimeout(timeoutId);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
  };

  const restore = () => {
    if (stopped) return;
    applyScrollY(targetY);
  };

  restore();
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });

  observer = new ResizeObserver(() => {
    restore();
  });
  observer.observe(document.documentElement);

  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);
  timeoutId = window.setTimeout(stop, RESTORE_WINDOW_MS);

  return stop;
}

/**
 * App Router + async homepage sections often restore scroll before layout
 * height exists, so Back lands at the hero. Manual restore keeps re-applying
 * the saved Y until the page height settles (or the user scrolls).
 */
export default function ScrollRestoration() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";
  const prevKeyRef = useRef<string | null>(null);
  const historyStackRef = useRef<string[]>([]);
  const restoringRef = useRef(false);
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
    lastYRef.current = window.scrollY || document.documentElement.scrollTop || 0;

    let ticking = false;

    const persistFromWindow = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      lastYRef.current = y;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        saveScrollForKey(activeKeyRef.current, lastYRef.current);
      });
    };

    const flushBeforeNav = () => {
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
      saveScrollForKey(key, lastYRef.current);
    };
  }, [pathname, searchKey]);

  useLayoutEffect(() => {
    const key = pathKey(pathname);
    const prevKey = prevKeyRef.current;
    prevKeyRef.current = key;

    const stack = historyStackRef.current;
    const pendingPop = pendingPopNavigation;
    pendingPopNavigation = false;

    const intentionalBack = consumeStorefrontBackIntent(key);
    const isBack =
      intentionalBack || isBackToKey(key, stack, pendingPop);
    historyStackRef.current = updateHistoryStack(stack, key, isBack);
    recordStorefrontNavigation(key, isBack);

    const savedY = readPositions()[key];
    const shouldRestore =
      isBack &&
      savedY != null &&
      savedY > 0 &&
      (intentionalBack || prevKey === null || prevKey !== key || pendingPop);

    if (shouldRestore) {
      restoringRef.current = true;
      const targetY = savedY;
      const stop = runScrollRestore(targetY);
      return () => {
        restoringRef.current = false;
        stop();
      };
    }

    restoringRef.current = false;

    if (prevKey !== null && prevKey !== key && !isBack) {
      applyScrollY(0);
      lastYRef.current = 0;
    }

    return undefined;
  }, [pathname, searchKey]);

  /** Next may scroll to top after layout — re-apply while restore window is active. */
  useEffect(() => {
    if (!restoringRef.current) return undefined;

    const key = pathKey(pathname);
    const targetY = readPositions()[key] ?? 0;
    if (targetY <= 0) return undefined;

    let frame = 0;
    let rafId = 0;

    const tick = () => {
      applyScrollY(targetY);
      frame += 1;
      if (frame < 12 && restoringRef.current) {
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
