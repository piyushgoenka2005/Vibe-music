"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "header";
  id?: string;
  /** Always visible — use for above-the-fold blocks (hero, first sections). */
  immediate?: boolean;
  /** Optional tone for accent styling (e.g. homepage stats). */
  "data-tone"?: string;
}

export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  id,
  immediate = false,
  "data-tone": dataTone,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const skipReveal = immediate || prefersReducedMotion;
  const [revealed, setRevealed] = useState(immediate);
  const [animate, setAnimate] = useState(!immediate && !prefersReducedMotion);

  const visible = skipReveal || revealed;

  useLayoutEffect(() => {
    if (skipReveal) return;

    const node = ref.current;
    if (!node) return;

    let done = false;
    let observer: IntersectionObserver | null = null;
    let fallbackTimer = 0;

    const revealNow = (immediateMatch = false) => {
      if (done) return;
      done = true;
      setRevealed(true);
      if (immediateMatch) {
        requestAnimationFrame(() => setAnimate(false));
      }
      observer?.disconnect();
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = 0;
      }
    };

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight + 250 && rect.bottom > -120) {
      revealNow(rect.top < window.innerHeight && rect.bottom > 0);
      return;
    }

    requestAnimationFrame(() => {
      if (!done) setAnimate(true);
    });

    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            revealNow(false);
          }
        },
        { threshold: 0, rootMargin: "250px 0px 250px 0px" },
      );
      observer.observe(node);
    } else {
      revealNow(true);
      return;
    }

    /* Safety net so tall sections on mobile never stay stuck at opacity: 0 */
    fallbackTimer = window.setTimeout(() => revealNow(false), 600);

    return () => {
      done = true;
      observer?.disconnect();
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, [skipReveal]);

  const classes = [
    "reveal",
    animate ? "reveal--animate" : "",
    visible ? "reveal--visible" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={ref as never}
      className={classes}
      id={id}
      data-tone={dataTone}
      style={{ transitionDelay: visible && animate ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  );
}
