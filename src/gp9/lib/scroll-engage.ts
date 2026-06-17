import { clamp } from "@/gp9/lib/scroll-performance";

export const ENGAGE_SELECTOR = "[data-scroll-engage]";

/** 0 at zone entry, 1 after scrolling through the full sticky range */
export function getScrollZoneProgress(zone: HTMLElement): number {
  const vh = window.innerHeight;
  const scrollRange = zone.offsetHeight - vh;
  if (scrollRange <= 0) return 0;
  return clamp(-zone.getBoundingClientRect().top / scrollRange);
}

/** 0 = normal scroll, 1 = fully slowed in the engage zone */
export function getScrollEngageFactor(): number {
  if (typeof window === "undefined") return 0;

  const zone = document.querySelector(ENGAGE_SELECTOR) as HTMLElement | null;
  if (!zone) return 0;

  const rect = zone.getBoundingClientRect();
  const vh = window.innerHeight;

  if (rect.bottom <= 0 || rect.top >= vh) return 0;

  return getScrollZoneProgress(zone);
}

export function getEngagedScrollBlend(factor: number, minBlend = 0.22) {
  return 1 - factor * (1 - minBlend);
}
