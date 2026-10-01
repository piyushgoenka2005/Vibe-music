import type { MouseEvent } from "react";
import type { LinkProps } from "next/link";

type LinkHref = LinkProps["href"];

function hrefToPath(href: LinkHref): string | null {
  if (typeof href === "string") return href;
  if (typeof href === "object" && href && "pathname" in href && href.pathname) {
    const query =
      href.query && typeof href.query === "object"
        ? `?${new URLSearchParams(
            Object.entries(href.query).flatMap(([key, value]) =>
              value == null ? [] : [[key, String(value)]],
            ),
          ).toString()}`
        : "";
    return `${href.pathname}${query}`;
  }
  return null;
}

/** True for a plain left-click that should stay in the same tab. */
export function isPrimarySameTabClick(event: MouseEvent<HTMLElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * Force a full document navigation instead of Next.js client routing.
 * Avoids stale homepage UI when RSC fetches fail on flaky TLS/network paths.
 */
export function hardNavigateToHref(event: MouseEvent<HTMLElement>, href: LinkHref): void {
  if (!isPrimarySameTabClick(event)) return;
  const path = hrefToPath(href);
  if (!path || path.startsWith("#") || path.startsWith("http")) return;
  event.preventDefault();
  window.location.assign(path);
}
