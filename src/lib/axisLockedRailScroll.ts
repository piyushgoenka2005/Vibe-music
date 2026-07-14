/**
 * Axis-locked horizontal rail: vertical swipes never call preventDefault
 * (page keeps scrolling). Confirmed sideways swipes drive scrollLeft.
 * Pair with CSS `touch-action: pan-y` on the element.
 */
export function attachAxisLockedRailScroll(el: HTMLElement): () => void {
  type Drag = {
    pointerId: number;
    startX: number;
    startY: number;
    startScroll: number;
    axis: "undecided" | "horizontal" | "vertical";
    moved: boolean;
  };

  const THRESHOLD = 8;
  let drag: Drag | null = null;

  const clear = (pointerId: number) => {
    drag = null;
    el.classList.remove("is-dragging");
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* already released */
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, input, textarea, select")) return;
    if (el.scrollWidth <= el.clientWidth + 8) return;

    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScroll: el.scrollLeft,
      axis: "undecided",
      moved: false,
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (drag.axis === "undecided") {
      if (Math.abs(deltaX) < THRESHOLD && Math.abs(deltaY) < THRESHOLD) return;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        clear(event.pointerId);
        return;
      }

      drag.axis = "horizontal";
      drag.moved = true;
      el.setPointerCapture(event.pointerId);
      el.classList.add("is-dragging");
    }

    if (drag.axis !== "horizontal") return;

    event.preventDefault();
    el.scrollLeft = drag.startScroll - deltaX;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const wasHorizontal = drag.axis === "horizontal" && drag.moved;
    clear(event.pointerId);

    if (wasHorizontal) {
      const suppress = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        el.removeEventListener("click", suppress, true);
      };
      el.addEventListener("click", suppress, true);
      window.setTimeout(() => {
        el.removeEventListener("click", suppress, true);
      }, 0);
    }
  };

  el.addEventListener("pointerdown", onPointerDown, { passive: true });
  el.addEventListener("pointermove", onPointerMove, { passive: false });
  el.addEventListener("pointerup", onPointerUp, { passive: true });
  el.addEventListener("pointercancel", onPointerUp, { passive: true });

  return () => {
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", onPointerUp);
    el.removeEventListener("pointercancel", onPointerUp);
    drag = null;
  };
}
