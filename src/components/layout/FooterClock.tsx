"use client";

import { useEffect, useState } from "react";

export default function FooterClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      }).format(now);
      setTime(`MUM/IND ${formatted}`);
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <span suppressHydrationWarning>{time || "MUM/IND —:—:—"}</span>;
}
