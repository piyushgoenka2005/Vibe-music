"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "vibe:scroll-positions";
/** Re-apply saved Y while homepage chunks / images expand after back. */
const RESTORE_WINDOW_MS = 1800;

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

/**
 * App Router + async homepage sections often restore scroll before layout
 * height exists, so Back lands 3–4 sections too low. Manual restore keeps
 * re-applying the saved Y until the page height settles (or the user scrolls).
 */
export default function ScrollRestoration() {
  const pathname = usePathname() ?? "";
  const pendingRestore = useRef(false);
  const prevKeyRef = useRef<string | null>(null);
  /** Last known scroll for the active key — survives Next scrolling to 0 mid-nav. */
  const lastYRef = useRef(0);
  const activeKeyRef = useRef(pathKey(pathname));

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const onPopState = () => {
      pendingRestore.current = true;
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
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

    /** Flush before Next resets scroll on link / back navigations. */
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
      // Do not write window.scrollY here — Next may already have reset it to 0.
      saveScrollForKey(key, lastYRef.current);
    };
  }, [pathname]);

  useLayoutEffect(() => {
    const key = pathKey(pathname);
    const prevKey = prevKeyRef.current;
    prevKeyRef.current = key;

    if (pendingRestore.current) {
      pendingRestore.current = false;
      const targetY = readPositions()[key] ?? lastYRef.current ?? 0;
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

    // Forward / link navigation: land at top (Next usually does this; force for consistency).
    if (prevKey !== null && prevKey !== key) {
      applyScrollY(0);
      lastYRef.current = 0;
    }

    return undefined;
  }, [pathname]);

  return null;
}
