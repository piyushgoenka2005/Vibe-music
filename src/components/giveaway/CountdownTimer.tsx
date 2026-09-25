"use client";

import { useEffect, useState } from "react";
import { getCountdownParts } from "@/lib/giveaway/countdown";

type CountdownParts = ReturnType<typeof getCountdownParts>;

const COUNTDOWN_UNITS: Array<{
  key: keyof Pick<CountdownParts, "days" | "hours" | "minutes" | "seconds">;
  label: string;
}> = [
  { key: "days", label: "days" },
  { key: "hours", label: "hrs" },
  { key: "minutes", label: "min" },
  { key: "seconds", label: "sec" },
];

function CountdownGrid({ parts }: { parts: CountdownParts | null }) {
  return (
    <div className="giveaway-countdown__grid">
      {COUNTDOWN_UNITS.map((unit) => (
        <div key={unit.key} className="giveaway-countdown__cell">
          <strong className="giveaway-countdown__value" aria-hidden={!parts}>
            {parts ? parts[unit.key] : "–"}
          </strong>
          <span className="giveaway-countdown__unit">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CountdownTimer({
  targetIso,
  label = "Ends in",
}: {
  targetIso: string;
  label?: string;
}) {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(targetIso));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetIso]);

  if (parts?.expired) {
    return <p className="giveaway-countdown giveaway-countdown--ended">Entry period ended</p>;
  }

  return (
    <div
      className={`giveaway-countdown${parts ? "" : " giveaway-countdown--pending"}`}
      aria-live="polite"
      aria-busy={!parts}
    >
      <span className="giveaway-countdown__label">{label}</span>
      <CountdownGrid parts={parts} />
    </div>
  );
}
