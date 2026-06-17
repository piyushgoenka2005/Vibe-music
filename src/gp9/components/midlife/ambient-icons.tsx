import type { SoundLayerId } from "@/gp9/lib/midlife-sounds";

export type AmbientIconId =
  | "bird"
  | "owl"
  | "forest"
  | "rain"
  | "storm"
  | "plane"
  | "ocean"
  | "ripple"
  | "steps"
  | "wind"
  | "sine"
  | "vinyl"
  | "flame"
  | "city"
  | "cat"
  | "moon"
  | "leaf";

export const AMBIENT_ICONS: { id: AmbientIconId; sound: SoundLayerId; label: string }[] = [
  { id: "bird", sound: "bird", label: "Birds" },
  { id: "owl", sound: "owl", label: "Owl" },
  { id: "forest", sound: "forest", label: "Forest" },
  { id: "rain", sound: "rain", label: "Rain" },
  { id: "storm", sound: "static", label: "Storm" },
  { id: "plane", sound: "plane", label: "Flight" },
  { id: "ocean", sound: "water", label: "Ocean" },
  { id: "ripple", sound: "water", label: "Ripple" },
  { id: "steps", sound: "steps", label: "Footsteps" },
  { id: "wind", sound: "wind", label: "Wind" },
  { id: "sine", sound: "machine", label: "Sine" },
  { id: "vinyl", sound: "static", label: "Vinyl" },
  { id: "flame", sound: "flame", label: "Fire" },
  { id: "city", sound: "city", label: "City" },
  { id: "cat", sound: "night", label: "Cat" },
  { id: "moon", sound: "night", label: "Night" },
  { id: "leaf", sound: "leaf", label: "Leaf" },
];

export function AmbientIcon({ id }: { id: AmbientIconId }) {
  switch (id) {
    case "bird":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M16 7c0-2-1.5-3.5-4-3.5S8 5 8 7s1.5 3.5 4 3.5S16 9 16 7Z" />
          <path d="M4 12c2-1 4-1 6 0s4 1 6 0M6 14l-2 2M18 14l2 2" />
        </svg>
      );
    case "owl":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <circle cx="12" cy="11" r="6" />
          <circle cx="9.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
          <path d="M12 14v2M9 17h6" />
          <path d="M8 6l2 2M16 6l-2 2" />
        </svg>
      );
    case "forest":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M12 3 8 11h8L12 3ZM12 11 9 17h6l-3-6Z" />
          <path d="M7 20h10" />
        </svg>
      );
    case "rain":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M7 9a4 4 0 0 1 8 0" />
          <path d="M8 14v3M12 13v4M16 14v3" />
        </svg>
      );
    case "storm":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M7 9a4 4 0 0 1 7.5 1H15a3 3 0 0 1 0 6h-1" />
          <path d="m13 14-2 4h3l-2 4" />
        </svg>
      );
    case "plane":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M3 12h4l3-7 2 7h9l-4 3 2 5-5-3-5 3 2-5-4-3Z" />
        </svg>
      );
    case "ocean":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M3 14c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
          <path d="M3 18c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
        </svg>
      );
    case "ripple":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case "steps":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <circle cx="12" cy="5" r="2" />
          <path d="M10 8v4l-2 3M14 8v4l2 3M9 20h6" />
        </svg>
      );
    case "wind":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M4 8h11a3 3 0 1 0-3-3M4 14h14a4 4 0 1 1-4 4" />
        </svg>
      );
    case "sine":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
        </svg>
      );
    case "vinyl":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "flame":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M12 3c-2 4-4 5-4 9a4 4 0 0 0 8 0c0-4-2-5-4-9Z" />
        </svg>
      );
    case "city":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M4 20V8l4-2v14M12 20V4l4 2v14M20 20V10l-2-1v11" />
        </svg>
      );
    case "cat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M6 8 4 4M18 8l2-4" />
          <circle cx="12" cy="13" r="5" />
          <circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="14" cy="12" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "moon":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M18 14a6 6 0 1 1-8-8 7 7 0 0 0 8 8Z" />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-[18px] w-[18px]">
          <path d="M6 18C14 16 18 8 18 4c-6 2-12 8-12 14Z" />
          <path d="M6 18c2-4 6-7 12-10" />
        </svg>
      );
    default:
      return null;
  }
}
