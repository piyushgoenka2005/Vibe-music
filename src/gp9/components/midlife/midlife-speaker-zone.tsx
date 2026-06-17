"use client";

import { MidlifeGrain } from "@/gp9/components/midlife/midlife-grain";
import { MidlifePowerKnob } from "@/gp9/components/midlife/midlife-power-knob";
import { cn } from "@/gp9/lib/utils";

type MidlifeSpeakerZoneProps = {
  powered?: boolean;
  onPower?: () => void;
  className?: string;
};

export function MidlifeSpeakerZone({ powered = false, onPower, className }: MidlifeSpeakerZoneProps) {
  return (
    <div className={cn("midlife-zone midlife-speaker-zone", className)}>
      <MidlifeGrain />
      <div className="midlife-speaker-grill-grid" aria-hidden>
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className="midlife-speaker-hole" />
        ))}
      </div>
      <MidlifePowerKnob active={powered} onClick={onPower} />
      <div className="midlife-power-probe" aria-hidden />
      <div className="midlife-side-logo" aria-hidden>
        <span>midlife</span>
        <span>engineering</span>
      </div>
    </div>
  );
}
