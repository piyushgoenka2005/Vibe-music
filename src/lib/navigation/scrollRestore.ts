/**
 * Pure helpers for storefront scroll restore (unit-tested).
 */

export const SCROLL_POSITIONS_KEY = "vibe:scroll-positions";
/** Section anchor saved when leaving a long page (homepage grids, etc.). */
export const SCROLL_ANCHORS_KEY = "vibe:scroll-anchors";
/** Survives React Strict Mode / Suspense remount after browser Back. */
export const PENDING_POP_RESTORE_KEY = "vibe:pending-pop-restore";
/** Re-apply saved Y while async sections / images expand after back. */
export const RESTORE_WINDOW_MS = 8000;
/** User must move this far from target before we treat it as intentional scroll. */
export const USER_SCROLL_CANCEL_PX = 40;
/** Height unchanged this long → layout considered settled. */
export const HEIGHT_STABLE_MS = 450;
/**
 * Next/App Router snaps window scroll to ~0 during route changes. Ignore that
 * transient reset so we do not overwrite the real section position.
 */
export const ROUTE_SCROLL_RESET_PX = 48;
/** How long after popstate / click-nav we refuse to clobber a mid-page Y with ~0. */
export const SCROLL_NAV_GUARD_MS = 2500;

export type PendingPopRestore = {
  key: string;
  at: number;
};

export type ScrollAnchorRecord = {
  sectionId: string;
  y: number;
};

export type ScrollAnchorsMap = Record<string, ScrollAnchorRecord>;

export function isBackToKey(key: string, stack: string[], pendingPop: boolean): boolean {
  const index = stack.lastIndexOf(key);
  if (pendingPop) {
    // Browser back/forward: only treat as back when this URL already exists earlier.
    return index !== -1;
  }
  return index !== -1 && index < stack.length - 1;
}

/**
 * Browser Back/Forward with a saved scroll position should restore even if the
 * in-memory stack was wiped (Suspense remount).
 */
export function shouldTreatAsBackNavigation(options: {
  intentionalBack: boolean;
  key: string;
  stack: string[];
  pendingPop: boolean;
  savedY: number | null | undefined;
}): boolean {
  const { intentionalBack, key, stack, pendingPop, savedY } = options;
  if (intentionalBack) return true;
  if (isBackToKey(key, stack, pendingPop)) return true;
  if (pendingPop && savedY != null && savedY > 0) return true;
  return false;
}

export function updateHistoryStack(stack: string[], key: string, isBack: boolean): string[] {
  if (isBack) {
    const index = stack.lastIndexOf(key);
    return index === -1 ? stack : stack.slice(0, index + 1);
  }
  if (stack[stack.length - 1] === key) return stack;
  return [...stack, key];
}

export function shouldPersistScrollWhileRestoring(restoring: boolean): boolean {
  return !restoring;
}

export function shouldCancelRestoreForUserScroll(
  currentY: number,
  targetY: number,
  thresholdPx = USER_SCROLL_CANCEL_PX,
): boolean {
  // Still parked at the top while Next resets scroll — keep restoring.
  if (currentY <= 2 && targetY > thresholdPx) return false;
  return Math.abs(currentY - targetY) > thresholdPx;
}

/**
 * True when scroll jumped to ~0 from a real mid-page position (route transition),
 * not when the user scrolled to the top gradually.
 */
export function shouldIgnoreTransientScrollReset(
  currentY: number,
  lastY: number,
  resetPx = ROUTE_SCROLL_RESET_PX,
): boolean {
  return currentY <= 2 && lastY > resetPx;
}

/** Prefer the larger of live Y and last known Y when flushing before navigation. */
export function resolveScrollYForPersist(liveY: number, lastY: number): number {
  if (shouldIgnoreTransientScrollReset(liveY, lastY)) return lastY;
  return liveY;
}

/**
 * Refuse to replace a mid-page saved Y with ~0 during the post-navigation guard
 * window (route snap / Strict Mode remount). Intentional top scrolls still save
 * once the guard expires.
 */
export function shouldSkipZeroScrollClobber(options: {
  nextY: number;
  previousY: number;
  lastKnownY?: number;
  navGuardActive: boolean;
  resetPx?: number;
}): boolean {
  const {
    nextY,
    previousY,
    lastKnownY = 0,
    navGuardActive,
    resetPx = ROUTE_SCROLL_RESET_PX,
  } = options;
  if (!navGuardActive) return false;
  const protectedY = Math.max(previousY, lastKnownY);
  return nextY <= 2 && protectedY > resetPx;
}

export function serializePendingPopRestore(value: PendingPopRestore): string {
  return JSON.stringify(value);
}

export function parsePendingPopRestore(
  raw: string | null,
  now = Date.now(),
  ttlMs = RESTORE_WINDOW_MS,
): PendingPopRestore | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as PendingPopRestore).key !== "string" ||
      typeof (parsed as PendingPopRestore).at !== "number"
    ) {
      // Legacy: bare path string without timestamp
      if (typeof raw === "string" && raw.startsWith("/")) {
        return { key: raw, at: now };
      }
      return null;
    }
    const value = parsed as PendingPopRestore;
    if (now - value.at > ttlMs) return null;
    return value;
  } catch {
    if (raw.startsWith("/")) return { key: raw, at: now };
    return null;
  }
}

export function isPendingPopRestoreForKey(
  pending: PendingPopRestore | null,
  key: string,
  now = Date.now(),
  ttlMs = RESTORE_WINDOW_MS,
): boolean {
  if (!pending) return false;
  if (pending.key !== key) return false;
  return now - pending.at <= ttlMs;
}

/** Shared flush used by ScrollRestoration + in-app back button. */
export function mergeScrollPositionForKey(
  positions: Record<string, number>,
  key: string,
  liveY: number,
  lastKnownY = 0,
  navGuardActive = false,
): Record<string, number> {
  const next = Math.max(0, Math.round(resolveScrollYForPersist(liveY, lastKnownY)));
  const previous = positions[key] ?? 0;
  if (
    shouldSkipZeroScrollClobber({
      nextY: next,
      previousY: previous,
      lastKnownY,
      navGuardActive,
    })
  ) {
    return positions;
  }
  return { ...positions, [key]: next };
}

export function shouldSkipSplashScrollToTop(options: {
  savedY: number | null | undefined;
  pendingPopMatches: boolean;
  intentionalBack: boolean;
  resetPx?: number;
}): boolean {
  const { savedY, pendingPopMatches, intentionalBack, resetPx = ROUTE_SCROLL_RESET_PX } = options;
  if (intentionalBack || pendingPopMatches) return true;
  return typeof savedY === "number" && savedY > resetPx;
}

/** True for in-app paths that should persist scroll before navigation. */
export function isSameOriginPathHref(href: string): boolean {
  const trimmed = href.trim();
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return false;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).origin === window.location.origin;
    } catch {
      return false;
    }
  }
  return trimmed.startsWith("/");
}

/**
 * Nearest homepage section id for scroll restore — prefers `<section id>`.
 */
export function findSectionAnchorId(from: Element | null): string | null {
  if (!from) return null;
  let el: Element | null = from;
  let fallback: string | null = null;
  while (el) {
    if (el.tagName === "SECTION" && el instanceof HTMLElement && el.id) {
      return el.id;
    }
    const vibe = el.getAttribute?.("data-vibe-section");
    if (vibe) fallback = fallback ?? vibe;
    const hp = el.getAttribute?.("data-hp-section");
    if (hp) fallback = fallback ?? hp;
    el = el.parentElement;
  }
  return fallback;
}

export function mergeScrollAnchorForKey(
  anchors: ScrollAnchorsMap,
  key: string,
  sectionId: string,
  y: number,
): ScrollAnchorsMap {
  if (!sectionId) return anchors;
  return {
    ...anchors,
    [key]: { sectionId, y: Math.max(0, Math.round(y)) },
  };
}

/** Pick the stronger restore target when a section anchor exists in the DOM. */
export function computeRestoreScrollY(
  savedY: number,
  sectionTopPx: number | null,
  headerOffsetPx: number,
): number {
  const baseY = Math.max(0, Math.round(savedY));
  if (sectionTopPx == null) return baseY;
  const anchorY = Math.max(0, Math.round(sectionTopPx - headerOffsetPx));
  return Math.max(baseY, anchorY);
}

export function readScrollPositions(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, number>;
  } catch {
    return {};
  }
}

export function readScrollAnchors(raw: string | null): ScrollAnchorsMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const map = parsed as Record<string, ScrollAnchorRecord>;
    const next: ScrollAnchorsMap = {};
    for (const [key, value] of Object.entries(map)) {
      if (value && typeof value.sectionId === "string" && typeof value.y === "number") {
        next[key] = value;
      }
    }
    return next;
  } catch {
    return {};
  }
}

/** Persist scroll (+ optional section anchor) synchronously before route change. */
export function persistStorefrontScroll(options: {
  key: string;
  liveY: number;
  lastKnownY: number;
  navGuardActive: boolean;
  sectionId?: string | null;
  positionsRaw?: string | null;
  anchorsRaw?: string | null;
}): void {
  const { key, liveY, lastKnownY, navGuardActive, sectionId, positionsRaw, anchorsRaw } = options;
  const y = Math.max(0, Math.round(resolveScrollYForPersist(liveY, lastKnownY)));
  const positions = mergeScrollPositionForKey(
    readScrollPositions(positionsRaw ?? null),
    key,
    y,
    lastKnownY,
    navGuardActive,
  );
  sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));

  if (sectionId) {
    const anchors = mergeScrollAnchorForKey(
      readScrollAnchors(anchorsRaw ?? null),
      key,
      sectionId,
      y,
    );
    sessionStorage.setItem(SCROLL_ANCHORS_KEY, JSON.stringify(anchors));
  }
}
