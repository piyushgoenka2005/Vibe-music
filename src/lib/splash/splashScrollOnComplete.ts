import {
  PENDING_POP_RESTORE_KEY,
  ROUTE_SCROLL_RESET_PX,
  SCROLL_POSITIONS_KEY,
  parsePendingPopRestore,
  shouldSkipSplashScrollToTop,
} from "@/lib/navigation/scrollRestore";

/** Scroll to top after splash unless Back/restore already has a saved position. */
export function splashScrollOnComplete() {
  if (typeof window === "undefined") return;

  try {
    const key = `${window.location.pathname}${window.location.search}`;
    const raw = sessionStorage.getItem(SCROLL_POSITIONS_KEY);
    let savedY: number | undefined;
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>;
      savedY = parsed?.[key];
    }
    const pending = parsePendingPopRestore(sessionStorage.getItem(PENDING_POP_RESTORE_KEY));
    const intentionalBack = sessionStorage.getItem("vibe:nav-back-intent") === key;
    if (
      shouldSkipSplashScrollToTop({
        savedY,
        pendingPopMatches: pending?.key === key,
        intentionalBack,
        resetPx: ROUTE_SCROLL_RESET_PX,
      })
    ) {
      return;
    }
  } catch {
    /* ignore */
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
