"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const SCROLL_THRESHOLD = 480;

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function animateScrollToTop() {
  const startY = window.scrollY;
  if (startY <= 0) return;

  const duration = Math.min(900, Math.max(450, startY * 0.4));
  const startTime = performance.now();

  function step(currentTime: number) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const nextY = startY * (1 - easeOutCubic(progress));
    window.scrollTo(0, nextY);
    document.documentElement.scrollTop = nextY;
    document.body.scrollTop = nextY;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    animateScrollToTop();
  }

  return (
    <button
      type="button"
      className={`back-to-top${visible ? " back-to-top--visible" : ""}`}
      onClick={scrollToTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp size={20} aria-hidden />
    </button>
  );
}
