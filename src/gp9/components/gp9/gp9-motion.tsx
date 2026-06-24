"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import { Children, isValidElement, type ReactNode } from "react";
import { cn } from "@/gp9/lib/utils";

export const GP9_SPRING_TAP = { type: "spring" as const, stiffness: 400, damping: 25 };
export const GP9_SPRING_KNOB = { type: "spring" as const, stiffness: 400, damping: 25 };
export const GP9_PANEL_STAGGER = 0.04;

const panelChildVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
  },
};

const panelContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: GP9_PANEL_STAGGER },
  },
};

type Gp9MotionButtonProps = HTMLMotionProps<"button">;

export function Gp9MotionButton({ className, children, ...props }: Gp9MotionButtonProps) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      className={className}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      transition={GP9_SPRING_TAP}
      {...props}
    >
      {children}
    </motion.button>
  );
}

type Gp9MotionLedProps = {
  active?: boolean;
  className?: string;
  variant?: "orange" | "blue" | "red";
};

const LED_GLOW: Record<NonNullable<Gp9MotionLedProps["variant"]>, string[]> = {
  orange: [
    "0 0 6px rgba(255,97,26,0.45)",
    "0 0 16px rgba(255,97,26,0.9)",
    "0 0 6px rgba(255,97,26,0.45)",
  ],
  blue: [
    "0 0 6px rgba(100,160,255,0.4)",
    "0 0 14px rgba(100,160,255,0.85)",
    "0 0 6px rgba(100,160,255,0.4)",
  ],
  red: [
    "0 0 6px rgba(255,68,68,0.5)",
    "0 0 14px rgba(255,68,68,0.95)",
    "0 0 6px rgba(255,68,68,0.5)",
  ],
};

export function Gp9MotionLed({ active, className, variant = "orange" }: Gp9MotionLedProps) {
  const reduce = useReducedMotion();

  return (
    <motion.span
      className={cn(className, active && "gp9-led--active")}
      aria-hidden
      animate={
        reduce
          ? undefined
          : active
            ? { boxShadow: LED_GLOW[variant] }
            : { boxShadow: "0 0 0 transparent" }
      }
      transition={
        active && !reduce
          ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.12 }
      }
    />
  );
}

export function Gp9PanelStagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={panelContainerVariants}
    >
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return child;
        return (
          <motion.div key={child.key ?? `gp9-panel-${i}`} variants={panelChildVariants}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
