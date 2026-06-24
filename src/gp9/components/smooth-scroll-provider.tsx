"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { getEngagedScrollBlend, getScrollEngageFactor } from "@/gp9/lib/scroll-engage";
import { isCoarsePointer, prefersReducedMotion } from "@/gp9/lib/scroll-performance";

const DESKTOP_SCROLL = {
  lerp: 0.072,
  wheelMultiplier: 0.58,
  touchMultiplier: 0.88,
  syncTouch: true,
  syncTouchLerp: 0.09,
  maxWheelDelta: 72,
  engageMaxWheelDelta: 38,
  engageWheelRatio: 0.62,
  engageMinBlend: 0.34,
  anchorOffset: -88,
  anchorDuration: 2,
  keyboardStep: 0.34,
  engageKeyboardStep: 0.16,
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function shouldPreventLenis(node: HTMLElement) {
  let el: HTMLElement | null = node;

  while (el && el !== document.documentElement) {
    if (el.hasAttribute("data-lenis-prevent")) return true;

    const { overflowX } = getComputedStyle(el);
    if (
      (overflowX === "auto" || overflowX === "scroll") &&
      el.scrollWidth > el.clientWidth + 1
    ) {
      return true;
    }

    el = el.parentElement;
  }

  return false;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.isContentEditable ||
      target.closest("input, textarea, select, [contenteditable='true']")
  );
}

function syncScrollEngage() {
  const factor = getScrollEngageFactor();
  document.documentElement.style.setProperty("--scroll-engage", factor.toFixed(3));
  window.dispatchEvent(new Event("app:scroll"));
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) {
      const onNativeScroll = () => syncScrollEngage();
      window.addEventListener("scroll", onNativeScroll, { passive: true });
      syncScrollEngage();
      return () => {
        window.removeEventListener("scroll", onNativeScroll);
        document.documentElement.style.removeProperty("--scroll-engage");
      };
    }

    const html = document.documentElement;
    html.classList.add("lenis", "lenis-smooth");

    const SCROLL = DESKTOP_SCROLL;
    let engageFactor = 0;

    const lenis = new Lenis({
      lerp: SCROLL.lerp,
      wheelMultiplier: SCROLL.wheelMultiplier,
      touchMultiplier: SCROLL.touchMultiplier,
      smoothWheel: true,
      syncTouch: SCROLL.syncTouch,
      syncTouchLerp: SCROLL.syncTouchLerp,
      autoRaf: true,
      anchors: {
        offset: SCROLL.anchorOffset,
        duration: SCROLL.anchorDuration,
        lerp: 0.06,
      },
      prevent: shouldPreventLenis,
      virtualScroll: (data) => {
        engageFactor = getScrollEngageFactor();
        const blend = getEngagedScrollBlend(engageFactor, SCROLL.engageMinBlend);

        data.deltaY *= blend * lerp(1, SCROLL.engageWheelRatio, engageFactor);

        const cap = lerp(SCROLL.maxWheelDelta, SCROLL.engageMaxWheelDelta, engageFactor);
        if (Math.abs(data.deltaY) > cap) {
          data.deltaY = Math.sign(data.deltaY) * cap;
        }

        return true;
      },
    });

    lenis.on("scroll", syncScrollEngage);

    const syncLenisState = () => {
      if (document.body.style.overflow === "hidden") {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    syncLenisState();

    const bodyObserver = new MutationObserver(syncLenisState);
    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      engageFactor = getScrollEngageFactor();
      const stepRatio = lerp(SCROLL.keyboardStep, SCROLL.engageKeyboardStep, engageFactor);
      const step = window.innerHeight * stepRatio;
      const scrollOptions = {
        duration: lerp(1.65, 2.4, engageFactor),
        lerp: lerp(0.06, 0.035, engageFactor),
      };

      if (event.key === "PageDown") {
        event.preventDefault();
        lenis.scrollTo(lenis.scroll + step, scrollOptions);
      } else if (event.key === "PageUp") {
        event.preventDefault();
        lenis.scrollTo(lenis.scroll - step, scrollOptions);
      } else if (event.key === " " && !event.shiftKey) {
        if (event.target instanceof HTMLElement && event.target.closest("button, a, summary")) {
          return;
        }
        event.preventDefault();
        lenis.scrollTo(lenis.scroll + step, scrollOptions);
      } else if (event.key === " " && event.shiftKey) {
        event.preventDefault();
        lenis.scrollTo(lenis.scroll - step, scrollOptions);
      } else if (event.key === "Home") {
        event.preventDefault();
        lenis.scrollTo(0, { duration: 2.6, lerp: 0.05 });
      } else if (event.key === "End") {
        event.preventDefault();
        lenis.scrollTo(document.documentElement.scrollHeight, { duration: 2.6, lerp: 0.05 });
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      html.classList.remove("lenis", "lenis-smooth");
      document.documentElement.style.removeProperty("--scroll-engage");
      bodyObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      lenis.destroy();
    };
  }, []);

  return children;
}
