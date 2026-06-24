import type { CSSProperties, ReactNode } from "react";

const iconProps = {
  className: "page-load-splash__icon-svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function SplashNoteIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 18V5l10-2v13" />
      <circle cx="7" cy="18" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="16" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SplashGuitarIcon() {
  return (
    <svg {...iconProps}>
      <path d="M11.5 3 8 9.5v2.5l-2 2v5.5a3 3 0 0 0 6 0v-1.5l2-2V9.5L13 3" />
      <circle cx="10" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M14 6.5 16 4" />
    </svg>
  );
}

export function SplashDrumIcon() {
  return (
    <svg {...iconProps}>
      <ellipse cx="12" cy="8" rx="7" ry="2.5" />
      <path d="M5 8v8c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V8" />
      <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </svg>
  );
}

export function SplashMicIcon() {
  return (
    <svg {...iconProps}>
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" />
    </svg>
  );
}

export function SplashHeadphonesIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </svg>
  );
}

export function SplashKeysIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="8" width="18" height="10" rx="1.5" />
      <path d="M7 8v6M11 8v6M15 8v6M19 8v6M5 14h14" />
    </svg>
  );
}

export function SplashSaxIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 3c2 2 2.5 4.5 1.5 7.5S12 16 10 18s-3 3-4 3" />
      <path d="M10 18c1.5-1 2.5-2.5 3-4.5" />
      <circle cx="7" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <path d="M15 5l2-2M16 8l2-1" />
    </svg>
  );
}

export function SplashTrumpetIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 10h11c2 0 3.5 1.2 4.5 2.5S21 16 21 16" />
      <path d="M4 10V8M4 12v2M7 10v2M10 10v2" />
      <circle cx="20.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SplashAmpIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="4" width="14" height="16" rx="1.5" />
      <circle cx="12" cy="11" r="3.5" />
      <path d="M8 19h8M9 7h1M14 7h1" />
    </svg>
  );
}

export function SplashVinylIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
    </svg>
  );
}

export function SplashBassIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 4v3M15 4v3M8 7h8v2l-1.5 1.5V18a2 2 0 0 1-4 0v-7.5L8 9V7z" />
      <path d="M10 20h4" />
    </svg>
  );
}

export function SplashMixerIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M7 9v6M11 8v8M15 10v4M19 9v6" />
      <circle cx="7" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SplashSpeakerIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4" y="6" width="8" height="12" rx="1" />
      <path d="M12 9c2 1 3 3 3 5s-1 4-3 5M15 7l3-2v14l-3-2" />
    </svg>
  );
}

const INNER_ITEMS = [
  { id: "guitar", Icon: SplashGuitarIcon },
  { id: "drum", Icon: SplashDrumIcon },
  { id: "mic", Icon: SplashMicIcon },
  { id: "headphones", Icon: SplashHeadphonesIcon },
  { id: "keys", Icon: SplashKeysIcon },
  { id: "note", Icon: SplashNoteIcon },
] as const;

const OUTER_ITEMS = [
  { id: "sax", Icon: SplashSaxIcon },
  { id: "trumpet", Icon: SplashTrumpetIcon },
  { id: "amp", Icon: SplashAmpIcon },
  { id: "vinyl", Icon: SplashVinylIcon },
  { id: "bass", Icon: SplashBassIcon },
  { id: "mixer", Icon: SplashMixerIcon },
  { id: "speaker", Icon: SplashSpeakerIcon },
] as const;

function OrbitIcons({
  items,
  orbitClass,
  radiusVar,
  delayBase,
}: {
  items: readonly { id: string; Icon: () => ReactNode }[];
  orbitClass: string;
  radiusVar: string;
  delayBase: number;
}) {
  return items.map((item, index) => (
    <span
      key={item.id}
      className={`page-load-splash__icon ${orbitClass}`}
      style={
        {
          "--icon-i": index,
          "--icon-count": items.length,
          "--orbit-radius": radiusVar,
          "--icon-delay": `${delayBase + index * 0.06}s`,
        } as CSSProperties
      }
    >
      <item.Icon />
    </span>
  ));
}

export default function SplashMusicalItems() {
  return (
    <div className="page-load-splash__items" aria-hidden>
      <div className="page-load-splash__ripples">
        {Array.from({ length: 10 }, (_, index) => (
          <span
            key={`ring-${index}`}
            className="page-load-splash__ripple-ring"
            style={{ "--ring-i": index + 1 } as CSSProperties}
          />
        ))}
      </div>

      <div className="page-load-splash__icon-orbit">
        <span className="page-load-splash__icon page-load-splash__icon--center">
          <SplashNoteIcon />
        </span>

        <OrbitIcons
          items={INNER_ITEMS}
          orbitClass="page-load-splash__icon--orbit-inner"
          radiusVar="clamp(5.5rem, 24vw, 7.5rem)"
          delayBase={0.08}
        />

        <OrbitIcons
          items={OUTER_ITEMS}
          orbitClass="page-load-splash__icon--orbit-outer"
          radiusVar="clamp(8.25rem, 36vw, 11.25rem)"
          delayBase={0.38}
        />
      </div>
    </div>
  );
}
