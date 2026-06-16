"use client";

import { useEffect, useState } from "react";

const CYCLING_PHRASES = ["Serious savings.", "Not-so-big prices."] as const;
const TYPING_INTERVAL_MS = 58;
const DELETING_INTERVAL_MS = 36;
const PHRASE_PAUSE_MS = 2600;

interface BigNamesTypewriterHeadlineProps {
  id: string;
}

export default function BigNamesTypewriterHeadline({ id }: BigNamesTypewriterHeadlineProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState<string>(CYCLING_PHRASES[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return undefined;

    const startTimer = window.setTimeout(() => {
      setMotionEnabled(true);
      setDisplayed("");
      setPhraseIndex(0);
      setIsDeleting(false);
    }, 0);

    return () => window.clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (!motionEnabled) return undefined;

    const target = CYCLING_PHRASES[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed === target) {
      timeout = setTimeout(() => setIsDeleting(true), PHRASE_PAUSE_MS);
    } else if (isDeleting && displayed === "") {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((current) => (current + 1) % CYCLING_PHRASES.length);
      }, 0);
    } else {
      const nextLength = isDeleting ? displayed.length - 1 : displayed.length + 1;
      timeout = setTimeout(
        () => setDisplayed(target.slice(0, nextLength)),
        isDeleting ? DELETING_INTERVAL_MS : TYPING_INTERVAL_MS
      );
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, motionEnabled, phraseIndex]);

  return (
    <h2 className="full-width-feature-sale-banner__headline" id={id}>
      <span className="full-width-feature-sale-banner__headline-static">Big names.</span>{" "}
      <span
        aria-live={motionEnabled ? "polite" : undefined}
        className="full-width-feature-sale-banner__headline-dynamic"
      >
        <span
          className="full-width-feature-sale-banner__typewriter-text"
          {...(motionEnabled ? { "aria-hidden": true } : {})}
        >
          {displayed}
        </span>
        {motionEnabled ? (
          <span
            aria-hidden="true"
            className="full-width-feature-sale-banner__typewriter-cursor"
          />
        ) : null}
      </span>
    </h2>
  );
}
