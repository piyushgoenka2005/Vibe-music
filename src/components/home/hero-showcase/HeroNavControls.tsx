"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

interface HeroNavControlsProps {
  onPrev: () => void;
  onNext: () => void;
  label?: string;
}

export default function HeroNavControls({
  onPrev,
  onNext,
  label = "Showcase scenes",
}: HeroNavControlsProps) {
  return (
    <div className="hero-showcase__nav-controls" aria-label={label}>
      <button
        type="button"
        className="hero-showcase__nav-btn"
        aria-label="Previous scene"
        onClick={onPrev}
      >
        <ChevronUp size={20} strokeWidth={2.25} aria-hidden />
      </button>
      <button
        type="button"
        className="hero-showcase__nav-btn"
        aria-label="Next scene"
        onClick={onNext}
      >
        <ChevronDown size={20} strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}
