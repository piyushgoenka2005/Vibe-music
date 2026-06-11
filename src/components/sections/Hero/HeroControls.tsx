import type { MouseEvent } from "react";

interface HeroControlsProps {
  isPaused: boolean;
  onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
}

const PAUSE_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const PLAY_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M8 5v14l11-7z" />
  </svg>
);

/** Play/pause control for the homepage triptych hero slideshow. */
export default function HeroControls({ isPaused, onToggle }: HeroControlsProps) {
  return (
    <button
      type="button"
      className="sw-hero__media-toggle"
      aria-label="Play/Pause slideshow"
      onClick={onToggle}
    >
      {isPaused ? PLAY_ICON : PAUSE_ICON}
    </button>
  );
}
