"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // In a real production app, this could be sent to an analytics endpoint (e.g. Google Analytics or Vercel Analytics)
    if (process.env.NODE_ENV === "development") {
      console.log(metric);
    }
  });

  return null;
}
