import { Bebas_Neue } from "next/font/google";
import type { CSSProperties } from "react";
import { BRAND } from "@/lib/brand";

const beatFont = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const CATEGORIES = [
  "Guitars",
  "Drums",
  "Studio",
  "Live Sound",
  "Bass",
  "Keys & Synth",
  "DJ Gear",
  "Deals",
  "Pro Audio",
  "Accessories",
] as const;

const VALUE_PROPS = [
  "Free Shipping",
  "Expert Gear Advice",
  "Easy EMI",
  "Easy Returns",
] as const;

function MarqueeTrack() {
  const loop = [...CATEGORIES, ...CATEGORIES];

  return (
    <div className="page-load-splash__beat-marquee" aria-hidden>
      <div className="page-load-splash__beat-marquee-track">
        {loop.map((label, index) => (
          <span key={`${label}-${index}`} className="page-load-splash__beat-chip">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SplashEcommerceBeat() {
  return (
    <div className="page-load-splash__beat" aria-hidden>
      <div className="page-load-splash__beat-rays" />

      <div className="page-load-splash__beat-frame">
        <p className={`page-load-splash__beat-eyebrow ${beatFont.className}`}>
          India&apos;s Music Gear Store
        </p>

        <div className="page-load-splash__beat-hero">
          <p className={`page-load-splash__beat-headline ${beatFont.className}`}>
            {BRAND.tagline.toUpperCase()}
          </p>

          <p className={`page-load-splash__beat-punch ${beatFont.className}`}>
            PLAY LOUDER · SHIP FASTER
          </p>

          <div className="page-load-splash__beat-props">
            {VALUE_PROPS.map((label, index) => (
              <span
                key={label}
                className="page-load-splash__beat-prop"
                style={{ "--prop-i": index } as CSSProperties}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="page-load-splash__beat-footer">
          <MarqueeTrack />
          <p className="page-load-splash__beat-enter">Entering the store…</p>
        </div>
      </div>
    </div>
  );
}
