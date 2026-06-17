"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
  const [visible, setVisible] = useState(immediate);
  const [animate, setAnimate] = useState(immediate);

  useLayoutEffect(() => {
    if (immediate) {
      setVisible(true);
      setAnimate(false);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedMotion) {
      setVisible(true);
      setAnimate(false);
      return;
    }

    const rect = node.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      setAnimate(false);
      setVisible(true);
      return;
    }

    setAnimate(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

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
