/** Wire Welcome section left/right arrows to the horizontal widget scroller. */
export function initPersonalizationCarousel(root: ParentNode): () => void {
  const section = root.querySelector("#personalization-widgets");
  if (!section) return () => {};

  const track = section.querySelector<HTMLElement>(
    ".personalization-widgets__inner"
  );
  const leftNav = section.querySelector<HTMLElement>(
    ".personalization-widgets__nav.nav--left"
  );
  const rightNav = section.querySelector<HTMLElement>(
    ".personalization-widgets__nav.nav--right"
  );
  const leftBtn = leftNav?.querySelector<HTMLButtonElement>("button");
  const rightBtn = rightNav?.querySelector<HTMLButtonElement>("button");

  if (!track || !leftBtn || !rightBtn) return () => {};

  const scroller = track;

  function getScrollAmount(): number {
    const firstWidget = scroller.querySelector<HTMLElement>(
      ".personalization-widget"
    );
    if (!firstWidget) return 320;
    const marginRight =
      parseFloat(window.getComputedStyle(firstWidget).marginRight) || 25;
    return firstWidget.offsetWidth + marginRight;
  }

  function updateNavState() {
    const atStart = scroller.scrollLeft <= 2;
    const atEnd =
      scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
    leftNav?.classList.toggle("disabled", atStart);
    rightNav?.classList.toggle("disabled", atEnd);
  }

  function scrollPrev() {
    scroller.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
  }

  function scrollNext() {
    scroller.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
  }

  leftBtn.addEventListener("click", scrollPrev);
  rightBtn.addEventListener("click", scrollNext);
  scroller.addEventListener("scroll", updateNavState, { passive: true });
  window.addEventListener("resize", updateNavState);

  updateNavState();

  return () => {
    leftBtn.removeEventListener("click", scrollPrev);
    rightBtn.removeEventListener("click", scrollNext);
    scroller.removeEventListener("scroll", updateNavState);
    window.removeEventListener("resize", updateNavState);
  };
}
