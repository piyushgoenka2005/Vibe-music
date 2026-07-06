"use client";

import { useEffect } from "react";

/** Pauses scanner CSS animations when the section is off-screen. */
export default function FindYourProductRuntime() {
  useEffect(() => {
    const block = document.querySelector<HTMLElement>("[data-find-your-product]");
    if (!block) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        block.classList.toggle("find-your-product--active", entry.isIntersecting);
        block.classList.toggle("find-your-product--paused", !entry.isIntersecting);
      },
      { rootMargin: "120px 0px", threshold: 0 }
    );

    observer.observe(block);
    return () => observer.disconnect();
  }, []);

  return null;
}
