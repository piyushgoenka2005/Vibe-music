"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "ul";
  role?: string;
  /** Extra delay steps before the first child (e.g. continue stagger from a prior grid). */
  staggerOffset?: number;
}

export default function RevealGroup({
  children,
  className = "",
  as: Tag = "div",
  role,
  staggerOffset = 0,
}: RevealGroupProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let done = false;
    let observer: IntersectionObserver | null = null;
    let fallbackTimer = 0;

    const markVisible = () => {
      if (done) return;
      done = true;
      setVisible(true);
      observer?.disconnect();
      window.removeEventListener("scroll", checkInView);
      window.removeEventListener("resize", checkInView);
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = 0;
      }
    };

    const checkInView = () => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200 && rect.bottom > -120) {
        markVisible();
      }
    };

    checkInView();
    if (done) return;

    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            markVisible();
          }
        },
        { threshold: 0, rootMargin: "200px 0px 200px 0px" },
      );
      observer.observe(node);
    } else {
      markVisible();
      return;
    }

    window.addEventListener("scroll", checkInView, { passive: true });
    window.addEventListener("resize", checkInView, { passive: true });
    fallbackTimer = window.setTimeout(markVisible, 900);

    return () => {
      done = true;
      observer?.disconnect();
      window.removeEventListener("scroll", checkInView);
      window.removeEventListener("resize", checkInView);
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      role={role}
      className={`reveal-group ${visible ? "reveal-group--visible" : ""} ${className}`.trim()}
      style={
        staggerOffset > 0
          ? ({ "--reveal-stagger-offset": staggerOffset } as CSSProperties)
          : undefined
      }
    >
      {children}
    </Tag>
  );
}
