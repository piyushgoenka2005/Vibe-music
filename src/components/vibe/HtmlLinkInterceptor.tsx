"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { resolveLinkHref } from "@/lib/routes";

const SECTION_SELECTOR =
  '[data-vibe-section="header"], [data-vibe-section="main"], [data-vibe-section="footer"]';

function patchSectionLinks(section: Element) {
  section.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
    const original = anchor.getAttribute("href");
    if (!original) return;

    const resolved = resolveLinkHref(original);
    if (resolved !== original) {
      anchor.setAttribute("href", resolved);
    }
  });

  section.querySelectorAll<HTMLFormElement>("form[action]").forEach((form) => {
    const action = form.getAttribute("action");
    if (!action) return;
    const resolved = resolveLinkHref(action);
    if (resolved !== action) {
      form.setAttribute("action", resolved);
    }
  });
}

export default function HtmlLinkInterceptor() {
  const router = useRouter();

  useEffect(() => {
    function patchAll() {
      document.querySelectorAll(SECTION_SELECTOR).forEach(patchSectionLinks);
    }

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (!anchor.closest(SECTION_SELECTOR)) return;
      if (anchor.target === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const resolved = resolveLinkHref(href);
      if (resolved === href) return;

      event.preventDefault();
      anchor.setAttribute("href", resolved);

      const url = new URL(resolved, window.location.origin);
      if (url.origin === window.location.origin) {
        router.push(`${url.pathname}${url.search}${url.hash}`);
      } else {
        window.location.href = resolved;
      }
    }

    const prefetched = new Set<string>();
    let hoverTimer: number | undefined;

    function onPointerOver(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank") return;

      const rawHref = anchor.getAttribute("href");
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:")
      )
        return;

      const href = resolveLinkHref(rawHref);
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;

      const path = href.startsWith("http") ? new URL(href).pathname : href.split("?")[0];
      if (prefetched.has(path)) return;

      if (hoverTimer) window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => {
        prefetched.add(path);
        try {
          router.prefetch(href);
        } catch {
          /* prefetch non-critical */
        }
      }, 40);
    }

    function onTouchStart(event: TouchEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank") return;

      const rawHref = anchor.getAttribute("href");
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:")
      )
        return;
      const href = resolveLinkHref(rawHref);
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;
      const path = href.startsWith("http") ? new URL(href).pathname : href.split("?")[0];
      if (prefetched.has(path)) return;
      prefetched.add(path);
      try {
        router.prefetch(href);
      } catch {
        /* prefetch non-critical */
      }
    }

    patchAll();

    const observer = new MutationObserver(patchAll);
    document.querySelectorAll(SECTION_SELECTOR).forEach((section) => {
      observer.observe(section, { childList: true, subtree: true });
    });

    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("touchstart", onTouchStart, { passive: true });

    return () => {
      observer.disconnect();
      if (hoverTimer) window.clearTimeout(hoverTimer);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("touchstart", onTouchStart);
    };
  }, [router]);

  return null;
}
