"use client";

import { Package } from "lucide-react";

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
      <Package size={22} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
