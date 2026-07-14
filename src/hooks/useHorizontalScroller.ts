"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { attachHorizontalWheelScroll } from "@/lib/horizontalWheelScroll";

type ScrollState = {
  hasOverflow: boolean;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

const IDLE: ScrollState = {
  hasOverflow: false,
  canScrollPrev: false,
  canScrollNext: false,
};

/**
 * Horizontal product rail: arrows, wheel/trackpad, and pointer-drag.
 */
export function useHorizontalScroller(sectionKey: string, itemCount: number) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScrollState>(IDLE);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const overflow = maxScroll > 8;
    const left = scroller.scrollLeft;
    setState({
      hasOverflow: overflow,
      canScrollPrev: overflow && left > 2,
      canScrollNext: overflow && left < maxScroll - 2,
    });
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    updateScrollState();
    const raf = window.requestAnimationFrame(updateScrollState);
    const detachWheel = attachHorizontalWheelScroll(scroller);

    scroller.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(updateScrollState);
    });
    resizeObserver.observe(scroller);
    for (const child of Array.from(scroller.children)) {
      if (child instanceof HTMLElement) resizeObserver.observe(child);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver.disconnect();
      detachWheel();
    };
  }, [updateScrollState, sectionKey, itemCount]);

  const scrollByCard = useCallback((direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const firstWrap = scroller.querySelector<HTMLElement>(
      ".product-suggest__item-wrap, .homepage-deals-card-wrap"
    );
    const styles = getComputedStyle(scroller);
    const gap =
      Number.parseFloat(styles.columnGap || styles.gap || "12") || 12;
    const amount =
      (firstWrap?.offsetWidth ?? Math.max(scroller.clientWidth * 0.75, 220)) +
      gap;
    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const next = Math.max(
      0,
      Math.min(maxScroll, scroller.scrollLeft + direction * amount)
    );

    scroller.scrollTo({ left: next, behavior: "smooth" });
    window.setTimeout(updateScrollState, 350);
  }, [updateScrollState]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        "a, button, input, textarea, select, [role='button'], .product-share-btn"
      )
    ) {
      return;
    }

    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (scroller.scrollWidth <= scroller.clientWidth + 8) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: scroller.scrollLeft,
      moved: false,
    };
    scroller.setPointerCapture(event.pointerId);
    scroller.classList.add("is-dragging");
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const scroller = scrollerRef.current;
    if (!drag || !scroller || drag.pointerId !== event.pointerId) return;

    const delta = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(delta) < 6) return;

    drag.moved = true;
    event.preventDefault();
    scroller.scrollLeft = drag.startScroll - delta;
  }, []);

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const scroller = scrollerRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    scroller?.classList.remove("is-dragging");
    try {
      scroller?.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }

    if (drag.moved) {
      // Suppress the click that would fire after a drag.
      const suppress = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        scroller?.removeEventListener("click", suppress, true);
      };
      scroller?.addEventListener("click", suppress, true);
      window.setTimeout(() => {
        scroller?.removeEventListener("click", suppress, true);
      }, 0);
    }

    updateScrollState();
  }, [updateScrollState]);

  return {
    scrollerRef,
    ...state,
    scrollByCard,
    scrollerProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
