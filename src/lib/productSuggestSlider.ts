/** Wire product-suggest carousel prev/next controls to horizontal item tracks. */
export function initProductSuggestSliders(root: ParentNode): () => void {
  const cleanups: Array<() => void> = [];

  root.querySelectorAll<HTMLElement>(".product-suggest__stage").forEach((stage) => {
    const items = stage.querySelector<HTMLElement>(".product-suggest__items");
    const prevNav = stage.querySelector<HTMLElement>(
      ".product-suggest__nav:not(.product-suggest__nav--next)"
    );
    const nextNav = stage.querySelector<HTMLElement>(
      ".product-suggest__nav--next"
    );

    if (!items || !prevNav || !nextNav) return;

    const scroller = items;
    const prevEl = prevNav;
    const nextEl = nextNav;

    function scrollAmount(): number {
      const firstWrap = scroller.querySelector<HTMLElement>(
        ".product-suggest__item-wrap"
      );
      if (!firstWrap) return 200;
      return firstWrap.offsetWidth;
    }

    function updateDisabled() {
      const atStart = scroller.scrollLeft <= 2;
      const atEnd =
        scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
      prevEl.classList.toggle("disabled", atStart);
      nextEl.classList.toggle("disabled", atEnd);
    }

    function updateOverflow() {
      const hasOverflow = scroller.scrollWidth > scroller.clientWidth + 2;
      prevEl.classList.toggle("visible", hasOverflow);
      nextEl.classList.toggle("visible", hasOverflow);
      updateDisabled();
    }

    function scrollPrev() {
      scroller.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    }

    function scrollNext() {
      scroller.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    }

    prevEl.addEventListener("click", scrollPrev);
    nextEl.addEventListener("click", scrollNext);
    scroller.addEventListener("scroll", updateDisabled, { passive: true });
    window.addEventListener("resize", updateOverflow);

    updateOverflow();

    cleanups.push(() => {
      prevEl.removeEventListener("click", scrollPrev);
      nextEl.removeEventListener("click", scrollNext);
      scroller.removeEventListener("scroll", updateDisabled);
      window.removeEventListener("resize", updateOverflow);
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
