"use client";

function WireframeCubeIcon() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 3v9" />
      <path d="M12 12l8-4.5" />
      <path d="M12 12L4 7.5" />
    </svg>
  );
}

interface GearStoryHotspotProps {
  onClick: () => void;
  label: string;
}

export default function GearStoryHotspot({ onClick, label }: GearStoryHotspotProps) {
  return (
    <button
      type="button"
      className="gear-story-hotspot"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
    >
      <WireframeCubeIcon />
    </button>
  );
}
