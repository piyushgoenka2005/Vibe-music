"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startScroll: number;
  axis: "undecided" | "horizontal" | "vertical";
  moved: boolean;
};

/**
 * Horizontal product rail: arrows + axis-locked drag for mouse/touch/pen.
 * Vertical page scroll is never trapped — only confirmed sideways swipes
 * take over the rail (requires non-passive pointermove for touch).
 */
export function useHorizontalScroller(sectionKey: string, itemCount: number) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScrollState>(IDLE);
  const dragRef = useRef<DragState | null>(null);

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

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    updateScrollState();
    const raf = window.requestAnimationFrame(updateScrollState);
    const detachWheel = attachHorizontalWheelScroll(scroller);

    const clearDrag = (pointerId: number) => {
      dragRef.current = null;
      scroller.classList.remove("is-dragging");
      try {
        scroller.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      const target = event.target as HTMLElement | null;
      // Keep share / form controls out of rail drag; product links stay in
      // so mobile swipes starting on a card can still pan horizontal.
      if (
        target?.closest(
          "button, input, textarea, select, .product-share-btn, .product-suggest__item-action"
        )
      ) {
        return;
      }

      if (scroller.scrollWidth <= scroller.clientWidth + 8) return;

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startScroll: scroller.scrollLeft,
        axis: "undecided",
        moved: false,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

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
          // Vertical intent — abandon; never preventDefault so the page scrolls.
          clearDrag(event.pointerId);
          return;
        }

        drag.axis = "horizontal";
        drag.moved = true;
        // Capture only after horizontal is confirmed — never during undecided.
        scroller.setPointerCapture(event.pointerId);
        scroller.classList.add("is-dragging");
      }

      if (drag.axis !== "horizontal") return;

      event.preventDefault();
      scroller.scrollLeft = drag.startScroll - deltaX;
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const wasHorizontalDrag = drag.axis === "horizontal" && drag.moved;
      clearDrag(event.pointerId);

      if (wasHorizontalDrag) {
        const suppress = (clickEvent: MouseEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          scroller.removeEventListener("click", suppress, true);
        };
        scroller.addEventListener("click", suppress, true);
        window.setTimeout(() => {
          scroller.removeEventListener("click", suppress, true);
        }, 0);
      }

      updateScrollState();
    };

    scroller.addEventListener("scroll", updateScrollState, { passive: true });
    scroller.addEventListener("pointerdown", onPointerDown, { passive: true });
    // Non-passive so horizontal touch can preventDefault after axis lock.
    scroller.addEventListener("pointermove", onPointerMove, { passive: false });
    scroller.addEventListener("pointerup", onPointerUp, { passive: true });
    scroller.addEventListener("pointercancel", onPointerUp, { passive: true });
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
      scroller.removeEventListener("pointerdown", onPointerDown);
      scroller.removeEventListener("pointermove", onPointerMove);
      scroller.removeEventListener("pointerup", onPointerUp);
      scroller.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver.disconnect();
      detachWheel();
      dragRef.current = null;
    };
  }, [updateScrollState, sectionKey, itemCount]);

  return {
    scrollerRef,
    ...state,
    scrollByCard,
    /** Listeners are attached natively; empty props keep call sites stable. */
    scrollerProps: {},
  };
}
