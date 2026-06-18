"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "header";
  id?: string;
  /** Always visible — use for above-the-fold blocks (hero, first sections). */
  immediate?: boolean;
}

export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  id,
  immediate = false,
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

    const rect = node.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      requestAnimationFrame(() => {
        setRevealed(true);
        setAnimate(false);
      });
      return;
    }

    requestAnimationFrame(() => setAnimate(true));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
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
      style={{ transitionDelay: visible && animate ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  );
}
