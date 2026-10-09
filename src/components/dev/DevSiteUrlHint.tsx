"use client";

import { useEffect } from "react";

/** One-time hint when .env.local points NEXT_PUBLIC_SITE_URL at production on localhost. */
export default function DevSiteUrlHint() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof window === "undefined") return;

    const configured = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const onLocalhost = /localhost|127\.0\.0\.1/i.test(window.location.hostname);
    if (!onLocalhost || !/vibemusic\.in/i.test(configured)) return;

    console.info(
      "[Vibe Music] Local dev: metadata/RSC use http://localhost (not NEXT_PUBLIC_SITE_URL). " +
        "Set NEXT_PUBLIC_SITE_URL=http://localhost:3000 in .env.local to match, or ignore if you need production URLs for OAuth tests.",
    );
  }, []);

  return null;
}
