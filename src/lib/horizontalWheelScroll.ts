/**
 * Horizontal wheel assist for product rails.
 * Never steals vertical page scroll — only reacts to clear sideways intent
 * (trackpad deltaX, Shift+wheel, or dominant horizontal delta).
 */
export function attachHorizontalWheelScroll(el: HTMLElement): () => void {
  const onWheel = (event: WheelEvent) => {
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 8) return;

    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    if (absX < 0.5 && absY < 0.5) return;

    const shiftHorizontal = event.shiftKey && absY >= absX;
    const nativeHorizontal = absX > absY * 1.15;

    // Pure/mostly-vertical gestures must keep scrolling the page.
    if (!shiftHorizontal && !nativeHorizontal) return;

    const delta = shiftHorizontal ? event.deltaY : event.deltaX;
    if (delta === 0) return;

    const nextLeft = el.scrollLeft + delta;
    const clamped = Math.max(0, Math.min(maxScroll, nextLeft));
    const moved = Math.abs(clamped - el.scrollLeft) > 0.5;
    if (!moved) return;

    event.preventDefault();
    el.scrollLeft = clamped;
  };

  el.addEventListener("wheel", onWheel, { passive: false });
  return () => el.removeEventListener("wheel", onWheel);
}
