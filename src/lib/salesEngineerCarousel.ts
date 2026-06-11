const SLIDE_INTERVAL_MS = 4000;

function focusLiveChat(): void {
  const widget = document.getElementById("twilio-webchat-widget-root");
  if (widget instanceof HTMLElement) {
    widget.focus();
  }
}

/** Rotate `#sales-engineer` hero slides and wire live-chat CTA. */
export function initSalesEngineerSection(root: ParentNode): () => void {
  const section = root.querySelector("#sales-engineer");
  if (!section) return () => {};

  const cleanups: Array<() => void> = [];

  section.querySelectorAll<HTMLElement>("[data-ada-live-chat]").forEach((node) => {
    const onChat = (event: Event) => {
      event.preventDefault();
      focusLiveChat();
    };
    node.addEventListener("click", onChat);
    cleanups.push(() => node.removeEventListener("click", onChat));
  });

  const slides = [
    ...section.querySelectorAll<HTMLElement>(".se-g--images .se-g--slide"),
  ];
  if (slides.length <= 1) {
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  let current = slides.findIndex((slide) => slide.id === "se-g--slide--current");
  if (current < 0) current = 0;

  const intervalId = window.setInterval(() => {
    slides[current]?.removeAttribute("id");
    current = (current + 1) % slides.length;
    slides[current].id = "se-g--slide--current";
  }, SLIDE_INTERVAL_MS);

  cleanups.push(() => window.clearInterval(intervalId));

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
