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
}

function readScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function useHideOnScroll({
  threshold = 8,
  minScroll = 72,
  disabled = false,
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
  }, [disabled, minScroll, threshold]);

  return disabled ? false : hidden;
}

export function useSiteHeaderOffset(headerRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncOffset = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty(
        "--site-header-offset",
        `${height}px`
      );
    };

    syncOffset();
    header.classList.add("site-header--ready");

    const observer = new ResizeObserver(syncOffset);
    observer.observe(header);
    window.addEventListener("resize", syncOffset);

    if (document.fonts?.ready) {
      void document.fonts.ready.then(syncOffset);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncOffset);
      header.classList.remove("site-header--ready");
    };
  }, [headerRef]);
}
