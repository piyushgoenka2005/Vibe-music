import type { CSSProperties } from "react";

/** SSR boot overlay — letter wave matches `PageLoadSplash` phase 1 (no settled classes). */
export default function VibeBootSplashMarkup() {
  const chars = "VIBE MUSIC".split("");

  return (
    <div className="page-load-splash__frame">
      <span className="page-load-splash__text">
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
    </div>
  );
}
