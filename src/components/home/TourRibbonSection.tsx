"use client";

import type { CSSProperties } from "react";
import { Anton } from "next/font/google";
import { TOUR_RIBBON_BANDS, type TourRibbonItem } from "@/data/tourRibbon";
import { useHydrationSafeReducedMotion } from "@/hooks/useHydrationSafeReducedMotion";
import "@/styles/tour-ribbon.css";

const tourDisplay = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-tour-ribbon",
});

function RibbonUnit({ item }: { item: TourRibbonItem }) {
  return (
    <span className="tour-ribbon__unit">
      <span className="tour-ribbon__headline">{item.headline}</span>
      <span className="tour-ribbon__stamp" aria-hidden>
        {item.stamp}
      </span>
      <span className="tour-ribbon__meta">{item.meta}</span>
    </span>
  );
}

export default function TourRibbonSection() {
  const reduceMotion = useHydrationSafeReducedMotion();

  return (
    <section
      className={`tour-ribbon ${tourDisplay.variable}`}
      aria-label="Vibe Music tour highlights"
      data-vibe-section="tour-ribbon"
    >
      <p className="visually-hidden">
        It&apos;s a vibe — Vibe Music® musical instruments, stage-ready gear,
        local pickup, and free shipping on every order.
      </p>

      <div className="tour-ribbon__stage" aria-hidden="true">
        {TOUR_RIBBON_BANDS.map((band, index) => {
          const sequence = [...band.items, ...band.items, ...band.items];
          const track = [...sequence, ...sequence];

          return (
            <div
              key={band.id}
              className={`tour-ribbon__band tour-ribbon__band--${index + 1}${
                reduceMotion ? " tour-ribbon__band--static" : ""
              }`}
            >
              <div
                className={`tour-ribbon__track tour-ribbon__track--${band.direction}`}
                style={
                  reduceMotion
                    ? undefined
                    : ({
                        "--tour-ribbon-duration": band.duration,
                      } as CSSProperties)
                }
              >
                {track.map((item, itemIndex) => (
                  <RibbonUnit
                    key={`${band.id}-${itemIndex}-${item.headline}`}
                    item={item}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
