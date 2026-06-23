"use client";

import { useReportWebVitals } from "next/web-vitals";

/** Placeholder for future Web Vitals RUM — see NEXT_PUBLIC_WEB_VITALS_ENDPOINT in .env.example */
export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "production") {
      console.debug("[Vital]", metric);
    }
  });
  return null;
}
