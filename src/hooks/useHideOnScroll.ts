"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

interface UseHideOnScrollOptions {
  /** Minimum scroll delta before toggling visibility */
  threshold?: number;
  /** Always show header near the top of the page */
  minScroll?: number;
  /** Disable auto-hide (e.g. mobile menu open) */
  disabled?: boolean;
  /** Keep header visible on viewports below 1024px (hamburger nav) */
  disableOnMobile?: boolean;
}

function readScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function useHideOnScroll({
  threshold = 8,
  minScroll = 72,
  disabled = false,
  disableOnMobile = false,
}: UseHideOnScrollOptions = {}) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useLayoutEffect(() => {
    if (disabled) {
      return;
    }

    lastScrollY.current = readScrollY();

    let ticking = false;

    const update = () => {
      if (disableOnMobile && window.matchMedia("(max-width: 1023px)").matches) {
        setHidden(false);
        lastScrollY.current = readScrollY();
        ticking = false;
        return;
      }

      const currentY = readScrollY();
      const delta = currentY - lastScrollY.current;

      if (currentY <= minScroll) {
        setHidden(false);
      } else if (delta > threshold) {
        setHidden(true);
      } else if (delta < -threshold) {
        setHidden(false);
      }

      lastScrollY.current = currentY;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("app:scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("app:scroll", onScroll);
    };
  }, [disabled, disableOnMobile, minScroll, threshold]);

  return disabled ? false : hidden;
}

export function useSiteHeaderOffset(headerRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncOffset = () => {
      // Measure every visible chrome band that paints over the page.
      // Do not rely solely on header.getBoundingClientRect() — collapsed
      // or absolutely-positioned children can under-report height.
      const bands = [
        ".announcement-bar",
        ".site-header__bar",
        ".site-header__nav--desktop",
      ] as const;

      let chromeBottom = 0;
      for (const selector of bands) {
        const el = header.querySelector<HTMLElement>(selector);
        if (!el) continue;

        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;

        const rect = el.getBoundingClientRect();
        if (rect.height < 1) continue;
        chromeBottom = Math.max(chromeBottom, rect.bottom);
      }

      const headerRect = header.getBoundingClientRect();
      if (chromeBottom < 1) {
        chromeBottom = headerRect.bottom;
      } else {
        // Prefer the larger of band bottoms vs header box when nav is in-flow.
        const nav = header.querySelector<HTMLElement>(".site-header__nav--desktop");
        const navInFlow =
          nav !== null &&
          getComputedStyle(nav).display !== "none" &&
          getComputedStyle(nav).position !== "fixed";
        if (navInFlow) {
          chromeBottom = Math.max(chromeBottom, headerRect.bottom);
        }
      }

      const hero = document.querySelector<HTMLElement>(".homepage-banner-hero");
      if (hero && document.body.classList.contains("is-landing-page")) {
        const gap = hero.getBoundingClientRect().top - headerRect.bottom;
        if (gap > 0.5) {
          chromeBottom = Math.max(chromeBottom, headerRect.bottom);
        }
      }

      // Exact chrome bottom — used by the mobile drawer/backdrop so they sit flush.
      const chrome = Math.round(chromeBottom);
      const chromeClamped = Math.max(56, Math.min(280, chrome));

      // +8px keeps titles/breadcrumbs from kissing the nav underline.
      const offset = chromeClamped + 8;
      const offsetClamped = Math.max(64, Math.min(288, offset));

      document.documentElement.style.setProperty(
        "--site-header-chrome",
        `${chromeClamped}px`
      );
      document.documentElement.style.setProperty(
        "--site-header-offset",
        `${offsetClamped}px`
      );
    };

    syncOffset();

    // Re-sync after fonts/layout settle and after route transitions.
    requestAnimationFrame(() => {
      syncOffset();
      requestAnimationFrame(syncOffset);
    });

    header.classList.add("site-header--ready");

    const observer = new ResizeObserver(syncOffset);
    observer.observe(header);
    const nav = header.querySelector(".site-header__nav--desktop");
    if (nav) observer.observe(nav);

    window.addEventListener("resize", syncOffset);
    window.addEventListener("site-header:sync", syncOffset);

    if (document.fonts?.ready) {
      void document.fonts.ready.then(syncOffset);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncOffset);
      window.removeEventListener("site-header:sync", syncOffset);
      header.classList.remove("site-header--ready");
    };
  }, [headerRef]);
}
