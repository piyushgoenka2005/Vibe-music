"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useRef } from "react";
import { cn } from "@/gp9/lib/utils";

const KNOB_CAPS = [
  "midlife-knob-cap--orange",
  "midlife-knob-cap--dark",
  "midlife-knob-cap--green",
  "midlife-knob-cap--silver",
] as const;

const KNOB_DIMPLES = [
  "midlife-knob-dimple--orange",
  "midlife-knob-dimple--blue",
  "midlife-knob-dimple--green",
  "midlife-knob-dimple--white",
] as const;

const KNOB_SPRING = { type: "spring" as const, stiffness: 400, damping: 25 };

type RotaryKnobProps = {
  value: number;
  onChange: (value: number) => void;
  index?: number;
  label?: string;
  className?: string;
  /** Animate rotation with a weighted spring (GP-9 console). */
  spring?: boolean;
};

export function RotaryKnob({
  value,
  onChange,
  index = 0,
  label = "Rotary knob",
  className,
  spring = false,
}: RotaryKnobProps) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const reduce = useReducedMotion();

  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startValue.current = value;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [value]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const delta = (startY.current - e.clientY) / 140;
      onChange(clamp(startValue.current + delta));
    },
    [onChange]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 0.05 : 0.02;
      if (e.key === "ArrowUp" || e.key === "ArrowRight") {
        e.preventDefault();
        onChange(clamp(value + step));
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        e.preventDefault();
        onChange(clamp(value - step));
      } else if (e.key === "Home") {
        e.preventDefault();
        onChange(0);
      } else if (e.key === "End") {
        e.preventDefault();
        onChange(1);
      }
    },
    [onChange, value]
  );

  const rotation = -140 + value * 280;
  const capClass = cn("midlife-knob-cap", KNOB_CAPS[index % KNOB_CAPS.length]);

  const cap =
    spring && !reduce ? (
      <motion.span
        className={capClass}
        animate={{ rotate: rotation }}
        transition={KNOB_SPRING}
        aria-hidden
      >
        <span className={cn("midlife-knob-dimple", KNOB_DIMPLES[index % KNOB_DIMPLES.length])} />
      </motion.span>
    ) : (
      <span className={capClass} style={{ transform: `rotate(${rotation}deg)` }} aria-hidden>
        <span className={cn("midlife-knob-dimple", KNOB_DIMPLES[index % KNOB_DIMPLES.length])} />
      </span>
    );

  return (
    <button
      type="button"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-valuetext={`${Math.round(value * 100)} percent`}
      role="slider"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={cn("midlife-knob touch-none", className)}
    >
      <span className="midlife-knob-ring" aria-hidden />
      {cap}
    </button>
  );
}
