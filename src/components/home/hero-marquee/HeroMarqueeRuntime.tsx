"use client";

import { useEffect } from "react";

/** Pauses marquee CSS animations when the block is off-screen. */
export default function HeroMarqueeRuntime() {
  useEffect(() => {
    const block = document.querySelector<HTMLElement>("[data-hero-marquee]");
    if (!block) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        block.classList.toggle("hero_marquee_block--active", entry.isIntersecting);
        block.classList.toggle("hero_marquee_block--paused", !entry.isIntersecting);
      },
      { rootMargin: "120px 0px", threshold: 0 }
    );

    observer.observe(block);
    return () => observer.disconnect();
  }, []);

  return null;
}
