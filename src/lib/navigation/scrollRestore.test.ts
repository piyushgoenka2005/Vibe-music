import { describe, expect, it } from "vitest";
import {
  isBackToKey,
  isPendingPopRestoreForKey,
  mergeScrollPositionForKey,
  parsePendingPopRestore,
  resolveScrollYForPersist,
  serializePendingPopRestore,
  shouldCancelRestoreForUserScroll,
  shouldIgnoreTransientScrollReset,
  shouldPersistScrollWhileRestoring,
  shouldSkipSplashScrollToTop,
  shouldSkipZeroScrollClobber,
  shouldTreatAsBackNavigation,
  updateHistoryStack,
  USER_SCROLL_CANCEL_PX,
} from "@/lib/navigation/scrollRestore";

describe("scrollRestore helpers", () => {
  it("isBackToKey treats pending pop as back when key exists in stack", () => {
    expect(isBackToKey("/", ["/", "/category/guitars"], true)).toBe(true);
    expect(isBackToKey("/other", ["/", "/category/guitars"], true)).toBe(false);
  });

  it("isBackToKey requires earlier stack membership without pop", () => {
    expect(isBackToKey("/", ["/", "/category/guitars"], false)).toBe(true);
    expect(isBackToKey("/category/guitars", ["/", "/category/guitars"], false)).toBe(
      false
    );
  });

  it("shouldTreatAsBackNavigation restores popstate even with empty stack when savedY exists", () => {
    expect(
      shouldTreatAsBackNavigation({
        intentionalBack: false,
        key: "/",
        stack: [],
        pendingPop: true,
        savedY: 1400,
      })
    ).toBe(true);

    expect(
      shouldTreatAsBackNavigation({
        intentionalBack: false,
        key: "/",
        stack: [],
        pendingPop: true,
        savedY: 0,
      })
    ).toBe(false);

    expect(
      shouldTreatAsBackNavigation({
        intentionalBack: true,
        key: "/",
        stack: [],
        pendingPop: false,
        savedY: null,
      })
    ).toBe(true);
  });

  it("updateHistoryStack trims on back and appends on forward", () => {
    expect(updateHistoryStack(["/", "/a", "/b"], "/a", true)).toEqual(["/", "/a"]);
    expect(updateHistoryStack(["/", "/a"], "/b", false)).toEqual(["/", "/a", "/b"]);
    expect(updateHistoryStack(["/", "/a"], "/a", false)).toEqual(["/", "/a"]);
  });

  it("shouldPersistScrollWhileRestoring is false during restore", () => {
    expect(shouldPersistScrollWhileRestoring(true)).toBe(false);
    expect(shouldPersistScrollWhileRestoring(false)).toBe(true);
  });

  it("shouldCancelRestoreForUserScroll only after meaningful delta", () => {
    expect(shouldCancelRestoreForUserScroll(1400, 1400)).toBe(false);
    expect(shouldCancelRestoreForUserScroll(1400 + USER_SCROLL_CANCEL_PX, 1400)).toBe(
      false
    );
    expect(
      shouldCancelRestoreForUserScroll(1400 + USER_SCROLL_CANCEL_PX + 1, 1400)
    ).toBe(true);
    // Still at top while Next resets — do not cancel restore.
    expect(shouldCancelRestoreForUserScroll(0, 1400)).toBe(false);
    expect(shouldCancelRestoreForUserScroll(2, 1400)).toBe(false);
  });

  it("shouldIgnoreTransientScrollReset detects route snap-to-top", () => {
    expect(shouldIgnoreTransientScrollReset(0, 1800)).toBe(true);
    expect(shouldIgnoreTransientScrollReset(1, 200)).toBe(true);
    expect(shouldIgnoreTransientScrollReset(0, 20)).toBe(false);
    expect(shouldIgnoreTransientScrollReset(120, 1800)).toBe(false);
  });

  it("resolveScrollYForPersist keeps last mid-page Y across route reset", () => {
    expect(resolveScrollYForPersist(0, 2200)).toBe(2200);
    expect(resolveScrollYForPersist(400, 2200)).toBe(400);
    expect(resolveScrollYForPersist(0, 10)).toBe(0);
  });

  it("shouldSkipZeroScrollClobber blocks mid-page overwrite during nav guard", () => {
    expect(
      shouldSkipZeroScrollClobber({
        nextY: 0,
        previousY: 1800,
        navGuardActive: true,
      })
    ).toBe(true);
    expect(
      shouldSkipZeroScrollClobber({
        nextY: 0,
        previousY: 0,
        lastKnownY: 1800,
        navGuardActive: true,
      })
    ).toBe(true);
    expect(
      shouldSkipZeroScrollClobber({
        nextY: 0,
        previousY: 1800,
        navGuardActive: false,
      })
    ).toBe(false);
    expect(
      shouldSkipZeroScrollClobber({
        nextY: 0,
        previousY: 10,
        navGuardActive: true,
      })
    ).toBe(false);
    expect(
      shouldSkipZeroScrollClobber({
        nextY: 400,
        previousY: 1800,
        navGuardActive: true,
      })
    ).toBe(false);
  });

  it("parsePendingPopRestore respects TTL and legacy bare paths", () => {
    const now = 1_000_000;
    const fresh = serializePendingPopRestore({ key: "/", at: now - 1000 });
    expect(parsePendingPopRestore(fresh, now)?.key).toBe("/");
    const stale = serializePendingPopRestore({ key: "/", at: now - 20_000 });
    expect(parsePendingPopRestore(stale, now)).toBeNull();
    expect(parsePendingPopRestore("/", now)?.key).toBe("/");
  });

  it("isPendingPopRestoreForKey matches key within TTL", () => {
    const now = 5_000;
    expect(
      isPendingPopRestoreForKey({ key: "/", at: now - 100 }, "/", now)
    ).toBe(true);
    expect(
      isPendingPopRestoreForKey({ key: "/a", at: now - 100 }, "/", now)
    ).toBe(false);
    expect(
      isPendingPopRestoreForKey({ key: "/", at: now - 20_000 }, "/", now)
    ).toBe(false);
  });

  it("mergeScrollPositionForKey keeps mid-page Y during guard", () => {
    expect(
      mergeScrollPositionForKey({ "/": 1800 }, "/", 0, 1800, true)["/"]
    ).toBe(1800);
    expect(
      mergeScrollPositionForKey({ "/": 1800 }, "/", 900, 900, false)["/"]
    ).toBe(900);
  });

  it("shouldSkipSplashScrollToTop when restoring or mid-page saved", () => {
    expect(
      shouldSkipSplashScrollToTop({
        savedY: 1400,
        pendingPopMatches: false,
        intentionalBack: false,
      })
    ).toBe(true);
    expect(
      shouldSkipSplashScrollToTop({
        savedY: 0,
        pendingPopMatches: true,
        intentionalBack: false,
      })
    ).toBe(true);
    expect(
      shouldSkipSplashScrollToTop({
        savedY: 0,
        pendingPopMatches: false,
        intentionalBack: true,
      })
    ).toBe(true);
    expect(
      shouldSkipSplashScrollToTop({
        savedY: 10,
        pendingPopMatches: false,
        intentionalBack: false,
      })
    ).toBe(false);
  });
});
