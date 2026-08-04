import { describe, expect, it } from "vitest";
import {
  isBackToKey,
  shouldCancelRestoreForUserScroll,
  shouldPersistScrollWhileRestoring,
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
    expect(shouldCancelRestoreForUserScroll(0, 1400)).toBe(true);
  });
});
