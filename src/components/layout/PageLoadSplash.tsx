"use client";

import { Bebas_Neue } from "next/font/google";
import { useEffect, useState, type CSSProperties } from "react";
import SplashMusicalItems from "@/components/layout/SplashMusicalItems";
import SplashCornerAccents from "@/components/layout/SplashCornerAccents";
import SplashEcommerceBeat from "@/components/layout/SplashEcommerceBeat";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const splashFont = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const WAVE_SETTLE_MS = 1100;
const BRAND_HOLD_MS = 380;
const BRAND_EXIT_MS = 300;
const TEASER_DELAY_MS = 720;
const ITEMS_PHASE_MS = 2100;
const FULL_EXIT_MS = 380;

interface PageLoadSplashProps {
  variant?: "initial" | "inline";
}

function SplashWaveText({ settled }: { settled: boolean }) {
  const chars = "VIBE MUSIC".split("");

  return (
    <span
      className={`page-load-splash__text ${splashFont.className}${settled ? " page-load-splash__text--settled" : ""}`}
    >
      {chars.map((char, index) => {
        if (char === " ") {
          return <span key={`space-${index}`} className="page-load-splash__space" aria-hidden />;
        }

        const waveBase = Math.sin(index * 0.72) * 0.22;

        return (
          <span
            key={`letter-${index}-${char}`}
            className="page-load-splash__letter"
            style={
              {
                "--wave-i": index,
                "--wave-base": `${waveBase.toFixed(3)}em`,
              } as CSSProperties
            }
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

function SplashMarkup({
  settled,
  brandExiting,
}: {
  settled: boolean;
  brandExiting: boolean;
}) {
  return (
    <div
      className={[
        "page-load-splash__frame",
        settled ? "page-load-splash__frame--settled" : "",
        brandExiting ? "page-load-splash__frame--exit" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SplashWaveText settled={settled} />
    </div>
  );
}

export function PageLoadSplashScreen({
  variant = "initial",
  exiting = false,
  settled = false,
  brandExiting = false,
  showItems = false,
  showTeaser = false,
}: {
  variant?: "initial" | "inline";
  exiting?: boolean;
  settled?: boolean;
  brandExiting?: boolean;
  showItems?: boolean;
  showTeaser?: boolean;
}) {
  const className = [
    "page-load-splash",
    variant === "inline" ? "page-load-splash--inline" : "",
    exiting ? "page-load-splash--exiting" : "",
    showItems ? "page-load-splash--items" : "",
    showTeaser ? "page-load-splash--teaser" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} role="status" aria-live="polite" aria-label="Loading Vibe Music">
      {showItems ? (
        <>
          <SplashCornerAccents />
          <SplashMusicalItems />
          {showTeaser ? <SplashEcommerceBeat /> : null}
        </>
      ) : (
        <SplashMarkup settled={settled} brandExiting={brandExiting} />
      )}
    </div>
  );
}

export default function PageLoadSplash({ variant = "initial" }: PageLoadSplashProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(variant === "initial");
  const [settled, setSettled] = useState(prefersReducedMotion);
  const [brandExiting, setBrandExiting] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setSettled(true);
      return;
    }

    const settleTimer = window.setTimeout(() => setSettled(true), WAVE_SETTLE_MS);
    return () => window.clearTimeout(settleTimer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (variant !== "initial") return;

    let brandExitTimer = 0;
    let itemsTimer = 0;
    let teaserTimer = 0;
    let fullExitTimer = 0;
    let hideTimer = 0;
    let cancelled = false;

    const itemsStart = WAVE_SETTLE_MS + BRAND_HOLD_MS + BRAND_EXIT_MS;

    const runSequence = () => {
      if (cancelled) return;

      if (prefersReducedMotion) {
        fullExitTimer = window.setTimeout(() => {
          setExiting(true);
          hideTimer = window.setTimeout(() => setVisible(false), 140);
        }, 280);
        return;
      }

      brandExitTimer = window.setTimeout(() => {
        setBrandExiting(true);
      }, WAVE_SETTLE_MS + BRAND_HOLD_MS);

      itemsTimer = window.setTimeout(() => {
        setShowItems(true);
      }, itemsStart);

      teaserTimer = window.setTimeout(() => {
        setShowTeaser(true);
      }, itemsStart + TEASER_DELAY_MS);

      fullExitTimer = window.setTimeout(() => {
        setExiting(true);
        hideTimer = window.setTimeout(() => {
          if (!cancelled) setVisible(false);
        }, FULL_EXIT_MS);
      }, itemsStart + ITEMS_PHASE_MS);
    };

    runSequence();

    return () => {
      cancelled = true;
      window.clearTimeout(brandExitTimer);
      window.clearTimeout(itemsTimer);
      window.clearTimeout(teaserTimer);
      window.clearTimeout(fullExitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [prefersReducedMotion, variant]);

  if (variant === "inline") {
    return <PageLoadSplashScreen variant="inline" settled showItems showTeaser />;
  }

  if (!visible) return null;

  return (
    <PageLoadSplashScreen
      variant="initial"
      exiting={exiting}
      settled={settled}
      brandExiting={brandExiting}
      showItems={showItems}
      showTeaser={showTeaser}
    />
  );
}
