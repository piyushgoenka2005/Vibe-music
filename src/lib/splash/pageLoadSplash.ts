/** Session key — first visit per tab shows the branded splash. */
export const SPLASH_SEEN_KEY = "vibe-splash-seen";

export const SPLASH_ACTIVE_CLASS = "vibe-splash-active";
export const SPLASH_PENDING_CLASS = "vibe-splash-pending";

/** Blue VIBE MUSIC boot screen — letter wave settles, then hold, then fade. */
export const SPLASH_WAVE_SETTLE_MS = 520;
export const SPLASH_BRAND_HOLD_MS = 2_000;
export const SPLASH_EXIT_MS = 480;
/** Minimum total time from splash start (covers fast hydration on production). */
export const SPLASH_MIN_TOTAL_MS = 2_600;
export const SPLASH_REDUCED_MOTION_HOLD_MS = 1_200;

/** Enabled by default; set NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH=false to disable. */
export function isPageLoadSplashEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH !== "false";
}
