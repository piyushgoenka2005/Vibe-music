type ScrollCallback = () => void;

const callbacks = new Set<ScrollCallback>();
let rafId: number | null = null;
let listening = false;

function onScroll() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(fireScrollCallbacks);
}

function fireScrollCallbacks() {
  rafId = null;
  callbacks.forEach((callback) => callback());
}

export function subscribeScroll(callback: ScrollCallback): () => void {
  callbacks.add(callback);

  if (!listening && typeof window !== "undefined") {
    listening = true;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("app:scroll", onScroll, { passive: true });
  }

  return () => {
    callbacks.delete(callback);
    if (callbacks.size === 0 && listening && typeof window !== "undefined") {
      listening = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("app:scroll", onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };
}

export function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function getStickyProgress(element: HTMLElement, multiplier = 2) {
  const scrollableHeight = window.innerHeight * multiplier;
  return clamp(-element.getBoundingClientRect().top / scrollableHeight);
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768;
}

export function observeSection(
  element: HTMLElement,
  onChange: (active: boolean) => void,
  rootMargin = "120px 0px 120px 0px"
) {
  const observer = new IntersectionObserver(
    ([entry]) => onChange(entry.isIntersecting),
    { rootMargin, threshold: 0 }
  );

  observer.observe(element);
  return () => observer.disconnect();
}
