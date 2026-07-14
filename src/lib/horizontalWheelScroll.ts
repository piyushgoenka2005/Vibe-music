/** Convert trackpad/mouse wheel into horizontal scrolling while overflow remains. */
export function attachHorizontalWheelScroll(el: HTMLElement): () => void {
  const onWheel = (event: WheelEvent) => {
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 4) return;

    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    if (absX < 0.5 && absY < 0.5) return;

    // Prefer native horizontal gestures; otherwise map vertical wheel to x-axis.
    const delta = absX > absY ? event.deltaX : event.deltaY;
    if (delta === 0) return;

    const nextLeft = el.scrollLeft + delta;
    const clamped = Math.max(0, Math.min(maxScroll, nextLeft));
    const moved = Math.abs(clamped - el.scrollLeft) > 0.5;

    // Only trap the page scroll while this rail can still move.
    if (!moved) return;

    event.preventDefault();
    el.scrollLeft = clamped;
  };

  el.addEventListener("wheel", onWheel, { passive: false });
  return () => el.removeEventListener("wheel", onWheel);
}
