/** Session key — first visit per tab shows the branded splash. */
export const SPLASH_SEEN_KEY = "vibe-splash-seen";

export const SPLASH_ACTIVE_CLASS = "vibe-splash-active";
export const SPLASH_PENDING_CLASS = "vibe-splash-pending";

/** Enabled by default; set NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH=false to disable. */
export function isPageLoadSplashEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PAGE_LOAD_SPLASH !== "false";
}
