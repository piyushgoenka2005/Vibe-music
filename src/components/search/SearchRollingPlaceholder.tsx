"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const SEARCH_TERMS = [
  "guitar",
  "Drums",
  "mics",
  "studio gear",
  "keyboards",
  "pedals",
  "headphones",
] as const;

const CYCLE_MS = 2600;

interface SearchRollingPlaceholderProps {
  inputId: string;
}

export default function SearchRollingPlaceholder({
  inputId,
}: SearchRollingPlaceholderProps) {
  const [visible, setVisible] = useState(true);
  const [termIndex, setTermIndex] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const motionEnabled = !prefersReducedMotion;

  useEffect(() => {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) return undefined;

    const syncVisibility = () => {
      setVisible(!input.value && document.activeElement !== input);
    };

    syncVisibility();
    input.addEventListener("input", syncVisibility);
    input.addEventListener("focus", syncVisibility);
    input.addEventListener("blur", syncVisibility);

    return () => {
      input.removeEventListener("input", syncVisibility);
      input.removeEventListener("focus", syncVisibility);
      input.removeEventListener("blur", syncVisibility);
    };
  }, [inputId]);

  useEffect(() => {
    if (!motionEnabled) return undefined;

    const interval = window.setInterval(() => {
      setTermIndex((current) => (current + 1) % SEARCH_TERMS.length);
    }, CYCLE_MS);

    return () => window.clearInterval(interval);
  }, [motionEnabled]);

  if (!visible) return null;

  const currentTerm = SEARCH_TERMS[termIndex];

  return (
    <span className="site-header__search-rolling" aria-hidden="true">
      <span className="site-header__search-rolling-static">Search for</span>
      <span className="site-header__search-rolling-viewport">
        <span
          className={[
            "site-header__search-rolling-word",
            motionEnabled ? "site-header__search-rolling-word--animate" : "",
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

export const SEARCH_ROLLING_ARIA_LABEL = `Search for ${SEARCH_TERMS.join(", ")}`;
