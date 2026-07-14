"use client";

import { useEffect, useState } from "react";
import { getCountdownParts } from "@/lib/giveaway/drawEngine";

export default function CountdownTimer({
  targetIso,
  label = "Ends in",
}: {
  targetIso: string;
  label?: string;
}) {
  const [parts, setParts] = useState(() => getCountdownParts(targetIso));

  useEffect(() => {
    const timer = setInterval(() => {
      setParts(getCountdownParts(targetIso));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetIso]);

  if (parts.expired) {
    return <p className="giveaway-countdown giveaway-countdown--ended">Entry period ended</p>;
  }

  return (
    <div className="giveaway-countdown" aria-live="polite">
      <span className="giveaway-countdown__label">{label}</span>
      <div className="giveaway-countdown__grid">
        <div><strong>{parts.days}</strong><span>days</span></div>
        <div><strong>{parts.hours}</strong><span>hrs</span></div>
        <div><strong>{parts.minutes}</strong><span>min</span></div>
        <div><strong>{parts.seconds}</strong><span>sec</span></div>
      </div>
    </div>
  );
}
