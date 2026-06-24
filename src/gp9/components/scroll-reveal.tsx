"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/gp9/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "up" | "scale" | "blur";
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  variant = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-1000 ease-out",
        !visible && variant === "up" && "translate-y-10 opacity-0",
        !visible && variant === "scale" && "scale-[0.97] opacity-0",
        !visible && variant === "blur" && "translate-y-6 opacity-0 blur-sm",
        visible && "translate-y-0 scale-100 opacity-100 blur-0",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
