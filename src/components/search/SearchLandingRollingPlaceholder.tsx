"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { SEARCH_LANDING_ROLLING_TERMS } from "@/data/searchLandingHints";

const CYCLE_MS = 2800;
const INPUT_ID = "sw-search-landing-input";

interface SearchLandingRollingPlaceholderProps {
  visible: boolean;
}

export default function SearchLandingRollingPlaceholder({
  visible,
}: SearchLandingRollingPlaceholderProps) {
  const [termIndex, setTermIndex] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  useEffect(() => {
    if (!motionEnabled || !visible) return undefined;

    const interval = window.setInterval(() => {
      setTermIndex((current) => (current + 1) % SEARCH_LANDING_ROLLING_TERMS.length);
    }, CYCLE_MS);

    return () => window.clearInterval(interval);
  }, [motionEnabled, visible]);

  if (!visible) return null;

  const currentTerm = SEARCH_LANDING_ROLLING_TERMS[termIndex];

  return (
    <span className="sw-search-landing-bar__rolling" aria-hidden="true">
      <span className="sw-search-landing-bar__rolling-static">Search for</span>
      <span className="sw-search-landing-bar__rolling-viewport">
        <span
          className={[
            "sw-search-landing-bar__rolling-word",
            motionEnabled ? "sw-search-landing-bar__rolling-word--animate" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          key={motionEnabled ? currentTerm : "static"}
        >
          {currentTerm}
        </span>
      </span>
    </span>
  );
}

export { INPUT_ID as SEARCH_LANDING_INPUT_ID };
