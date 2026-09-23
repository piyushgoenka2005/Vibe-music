"use client";

import { cn } from "@/gp9/lib/utils";

type DisplayStatus = "DORMANT" | "ACTIVE" | "RECORDING";

type MidlifePixelDisplayProps = {
  status?: DisplayStatus;
  powered?: boolean;
  className?: string;
};

type DisplayLine = { text: string; tone?: "muted" | "accent" };

function buildDisplayLines(status: DisplayStatus, powered: boolean): DisplayLine[] {
  if (!powered) {
    return [
      { text: "MIDLIFE ENGINEERING v2.0" },
      { text: "SYSTEM STATUS: DORMANT", tone: "accent" },
      { text: "Turn the POWER knob to wake the lab.", tone: "muted" },
    ];
  }
  if (status === "RECORDING") {
    return [
      { text: "MIDLIFE ENGINEERING v2.0" },
      { text: "SYSTEM STATUS: RECORDING", tone: "accent" },
      { text: "Capturing your mix session.", tone: "muted" },
    ];
  }
  if (status === "DORMANT") {
    return [
      { text: "MIDLIFE ENGINEERING v2.0" },
      { text: "SYSTEM STATUS: DORMANT", tone: "accent" },
      { text: "Select a beat, track, or ambient layer.", tone: "muted" },
    ];
  }
  return [
    { text: "> INIT DRONE" },
    { text: "Hold still." },
    { text: "Let it breathe.", tone: "muted" },
  ];
}

export function MidlifePixelDisplay({
  status = "DORMANT",
  powered = false,
  className,
}: MidlifePixelDisplayProps) {
  const lines = buildDisplayLines(status, powered);

  return (
    <div className={cn("midlife-display-framer", className)} aria-live="polite">
      <div className="midlife-display-framer-text">
        {lines.map((line) => (
          <span
            key={line.text}
            className={cn(
              "midlife-display-framer-line",
              line.tone === "accent" && "midlife-display-framer-line--accent",
              line.tone === "muted" && "midlife-display-framer-line--muted",
            )}
          >
            {line.text}
          </span>
        ))}
        <span className="midlife-display-framer-cursor" aria-hidden>
          |
        </span>
      </div>
    </div>
  );
}
