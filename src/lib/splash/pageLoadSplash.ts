/** Session key — first visit per tab shows the branded splash. */
export const SPLASH_SEEN_KEY = "vibe-splash-seen";

export const SPLASH_ACTIVE_CLASS = "vibe-splash-active";
export const SPLASH_PENDING_CLASS = "vibe-splash-pending";

/** Set on <html> once the React splash controller has started the sequence. */
export const SPLASH_CONTROLLER_ATTR = "data-splash-controller";
export const SPLASH_CONTROLLER_READY = "ready";

/** Phase 1 — framed VIBE MUSIC letter wave, hold, then frame exit. */
export const SPLASH_WAVE_SETTLE_MS = 1_100;
export const SPLASH_BRAND_HOLD_MS = 380;
export const SPLASH_BRAND_EXIT_MS = 300;

/** Phase 2 — orbit icons, then ecommerce beat (“Entering the store…”). */
export const SPLASH_TEASER_DELAY_MS = 720;
export const SPLASH_ITEMS_PHASE_MS = 2_100;

export const SPLASH_EXIT_MS = 380;
export const SPLASH_REDUCED_MOTION_HOLD_MS = 1_200;

const SPLASH_ITEMS_START_MS = SPLASH_WAVE_SETTLE_MS + SPLASH_BRAND_HOLD_MS + SPLASH_BRAND_EXIT_MS;

/** Minimum total time from splash start (covers fast hydration on production). */
export const SPLASH_MIN_TOTAL_MS = SPLASH_ITEMS_START_MS + SPLASH_ITEMS_PHASE_MS + SPLASH_EXIT_MS;

/** Enabled by default; set NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH=false to disable. */
export function isPageLoadSplashEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH !== "false";
}
