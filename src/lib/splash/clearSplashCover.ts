import {
  SPLASH_ACTIVE_CLASS,
  SPLASH_CONTROLLER_ATTR,
  SPLASH_PENDING_CLASS,
  SPLASH_SEEN_KEY,
} from "@/lib/splash/pageLoadSplash";

/** Remove splash cover classes and hide the SSR boot node. */
export function clearSplashCover(markSeen = false) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.remove(SPLASH_PENDING_CLASS, SPLASH_ACTIVE_CLASS);
  root.removeAttribute(SPLASH_CONTROLLER_ATTR);
  document.getElementById("vibe-boot-splash")?.setAttribute("hidden", "");

  if (markSeen) {
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }
}
