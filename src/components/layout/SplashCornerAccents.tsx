import type { CSSProperties } from "react";

const CORNERS = ["tl", "tr", "bl", "br"] as const;

function EqBars() {
  return (
    <div className="page-load-splash__eq">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className="page-load-splash__eq-bar"
          style={{ "--bar-i": index } as CSSProperties}
        />
      ))}
    </div>
  );
}

function FloatingNotes() {
  return (
    <div className="page-load-splash__float-notes">
      {["♪", "♫", "♩"].map((note, index) => (
        <span
          key={note}
          className="page-load-splash__float-note"
          style={{ "--note-i": index } as CSSProperties}
        >
          {note}
        </span>
      ))}
    </div>
  );
}

function VinylDisc() {
  return (
    <div className="page-load-splash__vinyl">
      <span className="page-load-splash__vinyl-disc" />
      <span className="page-load-splash__vinyl-arm" />
    </div>
  );
}

function WaveformPanel() {
  return (
    <div className="page-load-splash__wave-panel">
      <svg className="page-load-splash__wave-svg" viewBox="0 0 120 36" aria-hidden>
        <path
          className="page-load-splash__wave-path"
          d="M0 18 C10 6, 20 30, 30 18 S50 6, 60 18 80 30, 90 18 100 10, 120 18"
        />
      </svg>
      <span className="page-load-splash__wave-tag">GEAR UP</span>
    </div>
  );
}

function CornerBracket({ flip }: { flip?: "x" | "y" | "xy" }) {
  const transform =
    flip === "x"
      ? "scaleX(-1)"
      : flip === "y"
        ? "scaleY(-1)"
        : flip === "xy"
          ? "scale(-1)"
          : undefined;

  return (
    <span
      className="page-load-splash__bracket"
      style={transform ? { transform } : undefined}
      aria-hidden
    />
  );
}

export default function SplashCornerAccents() {
  return (
    <div className="page-load-splash__corners" aria-hidden>
      {CORNERS.map((corner, index) => (
        <div
          key={corner}
          className={`page-load-splash__corner page-load-splash__corner--${corner}`}
          style={{ "--corner-i": index } as CSSProperties}
        >
          <CornerBracket
            flip={corner === "tr" ? "x" : corner === "bl" ? "y" : corner === "br" ? "xy" : undefined}
          />

          {corner === "tl" ? <EqBars /> : null}
          {corner === "tr" ? <FloatingNotes /> : null}
          {corner === "bl" ? <VinylDisc /> : null}
          {corner === "br" ? <WaveformPanel /> : null}
        </div>
      ))}
    </div>
  );
}
