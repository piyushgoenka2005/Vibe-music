"use client";

import { cn } from "@/gp9/lib/utils";

type MidlifePowerKnobProps = {
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function MidlifePowerKnob({ active = false, onClick, className }: MidlifePowerKnobProps) {
  return (
    <button
      type="button"
      className={cn("midlife-power-knob", className)}
      onClick={onClick}
      aria-pressed={active}
      aria-label="Power"
    >
      <span className="midlife-power-knob-outer" aria-hidden />
      <span className="midlife-power-knob-mid" aria-hidden />
      <span className="midlife-power-knob-inner" aria-hidden />
      <span className="midlife-power-knob-cap" aria-hidden>
        <span
          className={cn("midlife-power-knob-dimple", active && "midlife-power-knob-dimple--on")}
          aria-hidden
        />
      </span>
      {active ? <span className="midlife-indicator-pulse" aria-hidden /> : null}
    </button>
  );
}
