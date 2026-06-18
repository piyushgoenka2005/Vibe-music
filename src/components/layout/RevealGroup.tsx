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

    const markVisible = (observer: IntersectionObserver) => {
      setVisible(true);
      observer.disconnect();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          markVisible(observer);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -16px 0px" }
    );

    observer.observe(node);

    const rect = node.getBoundingClientRect();
    const inView =
      rect.top < window.innerHeight - 32 && rect.bottom > 0;
    if (inView) {
      markVisible(observer);
    }

    return () => observer.disconnect();
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
