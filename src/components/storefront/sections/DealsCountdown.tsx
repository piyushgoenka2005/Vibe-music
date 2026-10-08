"use client";

import CountdownTimer from "@/components/giveaway/CountdownTimer";
import { getEndOfDayIstIso } from "@/lib/deals/dealsCountdown";

export default function DealsCountdown() {
  return (
    <div className="homepage-deals-section__countdown">
      <CountdownTimer targetIso={getEndOfDayIstIso()} label="Deals end in" />
    </div>
  );
}
