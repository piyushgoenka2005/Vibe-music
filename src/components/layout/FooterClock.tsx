"use client";

import { useEffect, useState } from "react";

function formatMumbaiClock(date: Date): string {
  const formatted = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(date);
  return `MUM/IND ${formatted}`;
}

export default function FooterClock() {
  const [time, setTime] = useState(() => formatMumbaiClock(new Date()));

  useEffect(() => {
    const tick = () => setTime(formatMumbaiClock(new Date()));
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <time dateTime={new Date().toISOString()} suppressHydrationWarning>
      {time}
    </time>
  );
}
