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

const DRAG_THRESHOLD_PX = 8;

/**
 * Horizontal product rail: arrows, intentional sideways gestures, and mouse-drag.
 * Vertical page scroll (wheel + touch) is never trapped.
 */
export function useHorizontalScroller(sectionKey: string, itemCount: number) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScrollState>(IDLE);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startScroll: number;
    axis: "undecided" | "horizontal" | "vertical";
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

  const scrollByCard = useCallback(
    (direction: -1 | 1) => {
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
    },
    [updateScrollState]
  );

  const clearDrag = useCallback((scroller: HTMLDivElement | null, pointerId: number) => {
    dragRef.current = null;
    scroller?.classList.remove("is-dragging");
    try {
      scroller?.releasePointerCapture(pointerId);
    } catch {
      /* already released */
    }
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    // Touch/pen page scroll must stay native — only mouse-drag the rail.
    if (event.pointerType !== "mouse") return;

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
      startY: event.clientY,
      startScroll: scroller.scrollLeft,
      axis: "undecided",
      moved: false,
    };
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      const scroller = scrollerRef.current;
      if (!drag || !scroller || drag.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      if (drag.axis === "undecided") {
        if (
          Math.abs(deltaX) < DRAG_THRESHOLD_PX &&
          Math.abs(deltaY) < DRAG_THRESHOLD_PX
        ) {
          return;
        }

        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          // Vertical intent — abandon so the page can scroll.
          clearDrag(scroller, event.pointerId);
          return;
        }

        drag.axis = "horizontal";
        drag.moved = true;
        scroller.setPointerCapture(event.pointerId);
        scroller.classList.add("is-dragging");
      }

      if (drag.axis !== "horizontal") return;

      event.preventDefault();
      scroller.scrollLeft = drag.startScroll - deltaX;
    },
    [clearDrag]
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      const scroller = scrollerRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const wasHorizontalDrag = drag.axis === "horizontal" && drag.moved;
      clearDrag(scroller, event.pointerId);

      if (wasHorizontalDrag) {
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
    },
    [clearDrag, updateScrollState]
  );

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
