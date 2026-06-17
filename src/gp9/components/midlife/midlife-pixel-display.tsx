"use client";

import { cn } from "@/gp9/lib/utils";

type DisplayStatus = "DORMANT" | "ACTIVE" | "RECORDING";

type MidlifePixelDisplayProps = {
  status?: DisplayStatus;
  powered?: boolean;
  className?: string;
};

function buildDisplayCopy(status: DisplayStatus, powered: boolean) {
  if (!powered) {
    return "MIDLIFE ENGINEERING v2.0\nSYSTEM STATUS: DORMANT\n\nPower required. Please switch on the machine.";
  }
  if (status === "RECORDING") {
    return "MIDLIFE ENGINEERING v2.0\nSYSTEM STATUS: RECORDING\n\nCapturing your mix session.";
  }
  if (status === "DORMANT") {
    return "MIDLIFE ENGINEERING v2.0\nSYSTEM STATUS: DORMANT\n\nReady. Select a beat or layer.";
  }
  return "> INIT DRONE\nHold still.\nLet it breathe.";
}

export function MidlifePixelDisplay({
  status = "DORMANT",
  powered = false,
  className,
}: MidlifePixelDisplayProps) {
  const copy = buildDisplayCopy(status, powered);

  return (
    <div className={cn("midlife-display-framer", className)} aria-live="polite">
      <span className="midlife-display-framer-text">
        {copy}
        <span className="midlife-display-framer-cursor" aria-hidden>
          |
        </span>
      </span>
    </div>
  );
}
