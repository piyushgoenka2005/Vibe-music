"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  clearStorefrontBackIntent,
  getStorefrontNavStackPaths,
  peekStorefrontBackIntent,
  recordStorefrontNavigation,
} from "@/lib/navigation/storefrontHistory";
import {
  PENDING_POP_RESTORE_KEY,
  RESTORE_SETTLE_MS,
  RESTORE_WINDOW_MS,
  ROUTE_SCROLL_RESET_PX,
  SCROLL_ANCHORS_KEY,
  SCROLL_NAV_GUARD_MS,
  SCROLL_POSITIONS_KEY,
  type ScrollAnchorsMap,
  type SectionBounds,
  computeRestoreScrollY,
  findScrollRailFromLink,
  findSectionAnchorId,
  isAnchorCurrent,
  isAuthScrollResetPath,
  isPendingPopRestoreForKey,
  isSameOriginPathHref,
  mergeScrollAnchorForKey,
  mergeScrollPositionForKey,
  parsePendingPopRestore,
  pickViewportSectionId,
  readScrollAnchors,
  resolveScrollYForPersist,
  restoreScrollRailForAnchor,
  serializePendingPopRestore,
  shouldIgnoreTransientScrollReset,
  shouldPersistScrollWhileRestoring,
  shouldTreatAsBackNavigation,
  updateHistoryStack,
} from "@/lib/navigation/scrollRestore";

/** Set synchronously in capture phase before React / Next handle popstate. */
let pendingPopNavigation = false;
/** Module-level — survives Strict Mode remount; location is already updated on popstate. */
let pendingPopRestoreKey: string | null = null;
let pendingPopRestoreAt = 0;
/** While active, refuse to clobber mid-page saved Y with ~0. */
let scrollNavGuardUntil = 0;
/** Last anchor taken from a clicked link — survives until the page unloads. */
let lastLinkAnchor: { key: string; at: number } | null = null;

function armScrollNavGuard(ms = SCROLL_NAV_GUARD_MS) {
  scrollNavGuardUntil = Math.max(scrollNavGuardUntil, Date.now() + ms);
}

function isScrollNavGuardActive() {
  return Date.now() < scrollNavGuardUntil;
}

function markPendingPopRestore(key: string) {
  pendingPopRestoreKey = key;
  pendingPopRestoreAt = Date.now();
  try {
    sessionStorage.setItem(
      PENDING_POP_RESTORE_KEY,
      serializePendingPopRestore({ key, at: pendingPopRestoreAt }),
    );
  } catch {
    /* ignore */
  }
}

function readPendingPopRestore() {
  if (pendingPopRestoreKey && Date.now() - pendingPopRestoreAt <= RESTORE_WINDOW_MS) {
    return { key: pendingPopRestoreKey, at: pendingPopRestoreAt };
  }
  try {
    const parsed = parsePendingPopRestore(sessionStorage.getItem(PENDING_POP_RESTORE_KEY));
    if (parsed) {
      pendingPopRestoreKey = parsed.key;
      pendingPopRestoreAt = parsed.at;
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function isPendingPopRestore(key: string): boolean {
  return isPendingPopRestoreForKey(readPendingPopRestore(), key);
}

function clearPendingPopRestore() {
  pendingPopRestoreKey = null;
  pendingPopRestoreAt = 0;
  try {
    sessionStorage.removeItem(PENDING_POP_RESTORE_KEY);
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener(
    "popstate",
    () => {
      pendingPopNavigation = true;
      armScrollNavGuard();
      markPendingPopRestore(`${window.location.pathname}${window.location.search}`);
    },
    true,
  );
}

let scrollPositionsCache: Record<string, number> | null = null;
let scrollAnchorsCache: ScrollAnchorsMap | null = null;
let writeTimeoutId = 0;

function readPositions(): Record<string, number> {
  if (scrollPositionsCache) return scrollPositionsCache;
  try {
    const raw = sessionStorage.getItem(SCROLL_POSITIONS_KEY);
    if (!raw) {
      scrollPositionsCache = {};
      return scrollPositionsCache;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      scrollPositionsCache = {};
      return scrollPositionsCache;
    }
    scrollPositionsCache = parsed as Record<string, number>;
    return scrollPositionsCache;
  } catch {
    scrollPositionsCache = {};
    return scrollPositionsCache;
  }
}

function flushPositionsSync() {
  if (writeTimeoutId) {
    window.clearTimeout(writeTimeoutId);
    writeTimeoutId = 0;
  }
  try {
    if (scrollPositionsCache) {
      sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(scrollPositionsCache));
    }
    if (scrollAnchorsCache) {
      sessionStorage.setItem(SCROLL_ANCHORS_KEY, JSON.stringify(scrollAnchorsCache));
    }
  } catch {
    /* quota / private mode */
  }
}

function writePositions(positions: Record<string, number>, sync = false) {
  scrollPositionsCache = positions;
  if (sync) {
    flushPositionsSync();
    return;
  }
  if (writeTimeoutId) return;
  writeTimeoutId = window.setTimeout(() => {
    writeTimeoutId = 0;
    flushPositionsSync();
  }, 250);
}

function readAnchors(): ScrollAnchorsMap {
  if (scrollAnchorsCache) return scrollAnchorsCache;
  try {
    scrollAnchorsCache = readScrollAnchors(sessionStorage.getItem(SCROLL_ANCHORS_KEY));
    return scrollAnchorsCache;
  } catch {
    scrollAnchorsCache = {};
    return scrollAnchorsCache;
  }
}

function writeAnchors(anchors: ScrollAnchorsMap, sync = false) {
  scrollAnchorsCache = anchors;
  if (sync) {
    flushPositionsSync();
    return;
  }
  if (writeTimeoutId) return;
  writeTimeoutId = window.setTimeout(() => {
    writeTimeoutId = 0;
    flushPositionsSync();
  }, 250);
}

function readHeaderOffsetPx(): number {
  const root = document.documentElement;
  const raw =
    getComputedStyle(root).getPropertyValue("--site-header-offset") ||
    getComputedStyle(root).getPropertyValue("--header-height");
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
}

function resolveSectionElement(sectionId: string): HTMLElement | null {
  return (
    document.getElementById(sectionId) ??
    document.querySelector<HTMLElement>(`[data-vibe-section="${CSS.escape(sectionId)}"]`) ??
    document.querySelector<HTMLElement>(`[data-hp-section="${CSS.escape(sectionId)}"]`)
  );
}

function resolveSectionTopPx(sectionId: string): number | null {
  const el = resolveSectionElement(sectionId);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return Math.max(0, Math.round(rect.top + (window.scrollY || 0)));
}

/** Section the reader is looking at (just under the sticky header). */
function findViewportSectionId(): string | null {
  const scope = document.querySelector("main") ?? document.body;
  const lineY = readHeaderOffsetPx() + 1;
  const bounds: SectionBounds[] = [];
  scope.querySelectorAll<HTMLElement>("section[id], [data-vibe-section]").forEach((el) => {
    const id = el.id || el.getAttribute("data-vibe-section");
    if (!id) return;
    // Fixed/sticky boxes track the viewport, so they can't anchor a scroll position.
    const position = getComputedStyle(el).position;
    if (position === "fixed" || position === "sticky") return;
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0) return;
    bounds.push({ id, top: rect.top, bottom: rect.bottom });
  });
  return pickViewportSectionId(bounds, lineY);
}

/** Offset of `y` into the section, measured against the live layout. */
function measureSectionOffset(sectionId: string, y: number): number | undefined {
  const top = resolveSectionTopPx(sectionId);
  return top == null ? undefined : y - top;
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

function saveScrollForKey(
  key: string,
  y: number,
  lastKnownY = y,
  sync = false,
  sectionId?: string | null,
  railScrollLeft?: number,
) {
  const nextPositions = mergeScrollPositionForKey(
    readPositions(),
    key,
    y,
    lastKnownY,
    isScrollNavGuardActive(),
  );
  writePositions(nextPositions, sync);
  // `undefined` = detect from the viewport (sync flushes only, never per scroll
  // frame); `null` = the DOM no longer belongs to `key`, keep the stored anchor.
  const anchorId =
    sectionId === undefined
      ? sync && y > ROUTE_SCROLL_RESET_PX
        ? findViewportSectionId()
        : null
      : sectionId;
  if (anchorId) {
    const nextAnchors = mergeScrollAnchorForKey(
      readAnchors(),
      key,
      anchorId,
      y,
      railScrollLeft,
      measureSectionOffset(anchorId, y),
    );
    writeAnchors(nextAnchors, sync);
  }
}

function resolveRestoreTargetY(key: string, savedY: number): number {
  const anchor = readAnchors()[key];
  if (!isAnchorCurrent(anchor, savedY)) return savedY;
  const sectionTop = resolveSectionTopPx(anchor.sectionId);
  return computeRestoreScrollY(savedY, sectionTop, readHeaderOffsetPx(), anchor.offset);
}

const RESTORE_TICK_MS = 100;

/**
 * Hold the anchored section in place while the page settles. Only real user
 * input ends the restore early — layout shifts, lazy sections and router
 * scroll resets are re-corrected instead of being mistaken for user scrolls.
 */
function runScrollRestore(key: string, savedY: number, onNaturalStop?: () => void) {
  const root = document.documentElement;
  const previousOverflowAnchor = root.style.overflowAnchor;
  // Native scroll anchoring would fight the section-relative target.
  root.style.overflowAnchor = "none";
  document.body.classList.add("is-scroll-restoring");

  const startedAt = Date.now();
  let stopped = false;
  let lastTargetY = -1;
  let lastHeight = -1;
  let settledSince = Date.now();
  let resizeObserver: ResizeObserver | null = null;
  let intervalId = 0;
  let timeoutId = 0;

  const currentTargetY = () => resolveRestoreTargetY(key, savedY);

  const teardown = (natural: boolean) => {
    if (stopped) return;
    stopped = true;
    root.style.overflowAnchor = previousOverflowAnchor;
    document.body.classList.remove("is-scroll-restoring");
    resizeObserver?.disconnect();
    if (intervalId) window.clearInterval(intervalId);
    if (timeoutId) window.clearTimeout(timeoutId);
    window.removeEventListener("wheel", onUserGesture, true);
    window.removeEventListener("touchstart", onUserGesture, true);
    window.removeEventListener("pointerdown", onUserGesture, true);
    window.removeEventListener("keydown", onUserGesture, true);
    window.removeEventListener("scroll", onScroll, true);
    if (natural) onNaturalStop?.();
  };

  const stopNatural = () => teardown(true);
  const stopForRemount = () => teardown(false);

  const restore = () => {
    if (stopped) return;
    const targetY = currentTargetY();
    const height = root.scrollHeight;
    if (Math.abs(targetY - lastTargetY) > 1 || height !== lastHeight) {
      lastTargetY = targetY;
      lastHeight = height;
      settledSince = Date.now();
    }
    const y = window.scrollY || root.scrollTop || 0;
    if (Math.abs(y - targetY) > 1) applyScrollY(targetY);
    restoreScrollRailForAnchor(readAnchors()[key]);
  };

  const onScroll = () => restore();

  const onUserGesture = () => {
    if (stopped) return;
    const y = window.scrollY || root.scrollTop || 0;
    // A stray touch before the page has moved off the top must not cancel.
    if (y <= 2 && currentTargetY() > ROUTE_SCROLL_RESET_PX) return;
    stopNatural();
  };

  const tick = () => {
    if (stopped) return;
    restore();
    const now = Date.now();
    if (
      document.readyState === "complete" &&
      now - startedAt >= RESTORE_SETTLE_MS &&
      now - settledSince >= RESTORE_SETTLE_MS
    ) {
      stopNatural();
    }
  };

  restore();
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });

  resizeObserver = new ResizeObserver(restore);
  resizeObserver.observe(root);
  if (document.body) resizeObserver.observe(document.body);

  window.addEventListener("wheel", onUserGesture, { passive: true, capture: true });
  window.addEventListener("touchstart", onUserGesture, { passive: true, capture: true });
  window.addEventListener("pointerdown", onUserGesture, { passive: true, capture: true });
  window.addEventListener("keydown", onUserGesture, true);
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });
  intervalId = window.setInterval(tick, RESTORE_TICK_MS);
  timeoutId = window.setTimeout(stopNatural, RESTORE_WINDOW_MS);

  return stopForRemount;
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
  /** Ignore Strict Mode cleanup stopping a restore we still need. */
  const restoreGenerationRef = useRef(0);

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
      const liveY = window.scrollY || document.documentElement.scrollTop || 0;
      if (!shouldIgnoreTransientScrollReset(liveY, lastYRef.current)) {
        lastYRef.current = liveY;
      }
    }

    let ticking = false;

    const persistFromWindow = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      if (!restoringRef.current) {
        // Route transitions snap to 0 before pathname updates — keep last real Y.
        if (shouldIgnoreTransientScrollReset(y, lastYRef.current)) {
          return;
        }
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

    const flushBeforeNav = (event?: Event) => {
      armScrollNavGuard();
      if (!shouldPersistScrollWhileRestoring(restoringRef.current)) return;
      const liveY = window.scrollY || document.documentElement.scrollTop || 0;
      const y = resolveScrollYForPersist(liveY, lastYRef.current);
      lastYRef.current = y;

      const key = activeKeyRef.current;
      // undefined = measure the viewport section; null = keep the stored anchor.
      let sectionId: string | null | undefined = event?.type === "click" ? undefined : null;
      let railScrollLeft: number | undefined;
      const target = event?.target;
      if (target instanceof Element) {
        const link = target.closest("a[href]");
        if (link instanceof HTMLAnchorElement) {
          const href = link.getAttribute("href");
          if (href && isSameOriginPathHref(href)) {
            sectionId = findSectionAnchorId(link) ?? undefined;
            if (sectionId) lastLinkAnchor = { key, at: Date.now() };
            const rail = findScrollRailFromLink(link);
            if (rail) railScrollLeft = rail.scrollLeft;
          }
        }
      } else if (!event) {
        // pagehide right after a link click: the clicked section is the better anchor.
        const linkAnchorFresh =
          lastLinkAnchor?.key === key &&
          Date.now() - lastLinkAnchor.at < SCROLL_NAV_GUARD_MS &&
          isAnchorCurrent(readAnchors()[key], y);
        sectionId = linkAnchorFresh ? null : undefined;
      }

      saveScrollForKey(key, y, y, true, sectionId, railScrollLeft);
    };

    window.addEventListener("scroll", persistFromWindow, { passive: true });
    const flushOnPageHide = () => flushBeforeNav();
    window.addEventListener("pagehide", flushOnPageHide);
    document.addEventListener("pointerdown", flushBeforeNav, true);
    document.addEventListener("click", flushBeforeNav, true);
    document.addEventListener("keydown", flushBeforeNav, true);

    return () => {
      window.removeEventListener("scroll", persistFromWindow);
      window.removeEventListener("pagehide", flushOnPageHide);
      document.removeEventListener("pointerdown", flushBeforeNav, true);
      document.removeEventListener("click", flushBeforeNav, true);
      document.removeEventListener("keydown", flushBeforeNav, true);
      if (shouldPersistScrollWhileRestoring(restoringRef.current)) {
        const liveY = window.scrollY || document.documentElement.scrollTop || 0;
        const y = resolveScrollYForPersist(liveY, lastYRef.current);
        lastYRef.current = y;
        saveScrollForKey(key, y);
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
    const pendingPopFlag = pendingPopNavigation;
    pendingPopNavigation = false;
    const pendingPop = pendingPopFlag || isPendingPopRestore(key);

    const intentionalBack = peekStorefrontBackIntent(key);
    const positions = readPositions();
    const savedY = positions[key];
    const isBack = shouldTreatAsBackNavigation({
      intentionalBack,
      key,
      stack,
      pendingPop,
      savedY,
    });
    historyStackRef.current = updateHistoryStack(stack, key, isBack);
    recordStorefrontNavigation(key, isBack);

    if (isAuthScrollResetPath(pathname)) {
      restoringRef.current = false;
      restoreTargetYRef.current = 0;
      clearPendingPopRestore();
      clearStorefrontBackIntent();
      applyScrollY(0);
      lastYRef.current = 0;
      if (savedY != null) {
        const { [key]: _removed, ...rest } = positions;
        writePositions(rest, true);
      }
      // Images/fonts can expand the card after first paint — pin auth routes to top.
      requestAnimationFrame(() => applyScrollY(0));
      return undefined;
    }

    const shouldRestore =
      isBack &&
      savedY != null &&
      savedY > ROUTE_SCROLL_RESET_PX &&
      (intentionalBack || pendingPop || prevKey === null || prevKey !== key);

    if (shouldRestore) {
      const generation = ++restoreGenerationRef.current;
      restoringRef.current = true;
      const targetY = resolveRestoreTargetY(key, savedY);
      restoreTargetYRef.current = targetY;
      armScrollNavGuard(RESTORE_WINDOW_MS);

      const stopForRemount = runScrollRestore(key, savedY, () => {
        // Natural end (settled / timeout / user input) — clear durable back markers.
        if (restoreGenerationRef.current === generation) {
          lastYRef.current = Math.round(window.scrollY || document.documentElement.scrollTop || 0);
          saveScrollForKey(key, lastYRef.current, lastYRef.current, true);
          armScrollNavGuard(SCROLL_NAV_GUARD_MS);
          restoringRef.current = false;
          restoreTargetYRef.current = 0;
          clearPendingPopRestore();
          clearStorefrontBackIntent();
        }
      });

      const capturedGeneration = restoreGenerationRef.current;
      return () => {
        // Strict Mode remount: tear down listeners but keep session markers so
        // the next layout effect can restore again. Keep restoringRef true so
        // persist cleanup does not write Y=0 during the remount gap.
        stopForRemount();
        if (capturedGeneration === generation) {
          restoringRef.current = true;
        }
      };
    }

    restoringRef.current = false;
    restoreTargetYRef.current = 0;

    // Back detected but nothing to restore (or already at top) — drop markers.
    if (isBack) {
      clearPendingPopRestore();
      clearStorefrontBackIntent();
    } else {
      const pending = readPendingPopRestore();
      if (pending && pending.key !== key) clearPendingPopRestore();
    }

    if (prevKey !== null && prevKey !== key && !isBack) {
      const departingY = lastYRef.current;
      if (departingY > ROUTE_SCROLL_RESET_PX) {
        // DOM already shows the new route — keep the anchor captured before nav.
        saveScrollForKey(prevKey, departingY, departingY, true, null);
      }
      armScrollNavGuard();
      applyScrollY(0);
      lastYRef.current = 0;
      clearStorefrontBackIntent();
    }

    return undefined;
  }, [pathname, searchKey]);

  /** Next may scroll to top after layout — re-apply the live target while restoring. */
  useEffect(() => {
    if (!restoringRef.current) return undefined;
    if (restoreTargetYRef.current <= 0) return undefined;

    const key = activeKeyRef.current;
    const savedY = readPositions()[key] ?? restoreTargetYRef.current;
    let frame = 0;
    let rafId = 0;

    const tick = () => {
      if (!restoringRef.current) return;
      applyScrollY(resolveRestoreTargetY(key, savedY));
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
