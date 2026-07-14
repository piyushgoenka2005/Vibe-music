import { attachHorizontalWheelScroll } from "@/lib/horizontalWheelScroll";

/** Wire tile carousel prev/next controls to horizontal `.tiles--slider` tracks. */
export function initTileSliders(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];

  root.querySelectorAll<HTMLElement>("[data-prev-id]").forEach((prevControl) => {
    const sliderId = prevControl.getAttribute("data-prev-id");
    if (!sliderId) return;

    const slider = root.querySelector<HTMLElement>(`#${CSS.escape(sliderId)}`);
    const nextControl = root.querySelector<HTMLElement>(
      `[data-next-id="${sliderId}"]`
    );
    const tileBlock = slider?.closest<HTMLElement>(".tile-block");

    if (!slider || !nextControl || !tileBlock) return;

    const sliderEl = slider;
    const prevEl = prevControl;
    const nextEl = nextControl;
    const blockEl = tileBlock;

    function scrollAmount(): number {
      const firstTile = sliderEl.querySelector<HTMLElement>(
        ".homepage-deals-card-wrap, .tile--link"
      );
      if (!firstTile) return sliderEl.clientWidth * 0.75;
      const style = window.getComputedStyle(sliderEl);
      const gap = parseFloat(style.columnGap || style.gap || "0") || 16;
      return firstTile.offsetWidth + gap;
    }

    function updateDisabled() {
      const atStart = sliderEl.scrollLeft <= 2;
      const atEnd =
        sliderEl.scrollLeft + sliderEl.clientWidth >= sliderEl.scrollWidth - 2;
      prevEl.classList.toggle("disabled", atStart);
      nextEl.classList.toggle("disabled", atEnd);
    }

    function updateOverflow() {
      const hasOverflow = sliderEl.scrollWidth > sliderEl.clientWidth + 2;
      blockEl.classList.toggle("has-overflow", hasOverflow);
      updateDisabled();
    }

    function scrollPrev() {
      sliderEl.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    }

    function scrollNext() {
      sliderEl.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    }

    prevEl.addEventListener("click", scrollPrev);
    nextEl.addEventListener("click", scrollNext);
    sliderEl.addEventListener("scroll", updateDisabled, { passive: true });
    window.addEventListener("resize", updateOverflow);
    cleanups.push(attachHorizontalWheelScroll(sliderEl));

    updateOverflow();

    cleanups.push(() => {
      prevEl.removeEventListener("click", scrollPrev);
      nextEl.removeEventListener("click", scrollNext);
      sliderEl.removeEventListener("scroll", updateDisabled);
      window.removeEventListener("resize", updateOverflow);
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
