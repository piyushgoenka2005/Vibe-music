/**
 * Pure helpers for storefront scroll restore (unit-tested).
 */

export const SCROLL_POSITIONS_KEY = "vibe:scroll-positions";
/** Re-apply saved Y while async sections / images expand after back. */
export const RESTORE_WINDOW_MS = 5500;
/** User must move this far from target before we treat it as intentional scroll. */
export const USER_SCROLL_CANCEL_PX = 40;
/** Height unchanged this long → layout considered settled. */
export const HEIGHT_STABLE_MS = 450;

export function isBackToKey(
  key: string,
  stack: string[],
  pendingPop: boolean
): boolean {
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

export function updateHistoryStack(
  stack: string[],
  key: string,
  isBack: boolean
): string[] {
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
  thresholdPx = USER_SCROLL_CANCEL_PX
): boolean {
  return Math.abs(currentY - targetY) > thresholdPx;
}
