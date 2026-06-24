import type { Gp9CameraPresetId, Gp9FinishId, Gp9PerformanceModeId } from "@/gp9/lib/gp9-runtime";

export type Gp9CinematicShot = {
  id: string;
  index: number;
  label: string;
  title: string;
  subtitle: string;
  body: string;
  performanceModeId: Gp9PerformanceModeId;
  cameraPreset: Gp9CameraPresetId;
  finishId: Gp9FinishId;
  lidOpen: number;
};

export const GP9_CINEMATIC_SHOTS: Gp9CinematicShot[] = [
  {
    id: "entrance",
    index: 0,
    label: "01 / 07",
    title: "Grand entrance",
    subtitle: "Polished ebony · concert presence",
    body: "The GP-9 arrives as furniture and instrument — a digital grand with the silhouette of a concert cabinet.",
    performanceModeId: "recital",
    cameraPreset: "performance",
    finishId: "polished_ebony",
    lidOpen: 0.25,
  },
  {
    id: "touch",
    index: 1,
    label: "02 / 07",
    title: "Hybrid touch",
    subtitle: "88 keys · velocity · escapement",
    body: "Scroll into the keyboard plane — white and black keys respond with emissive feedback synced to every note.",
    performanceModeId: "studio",
    cameraPreset: "keys",
    finishId: "polished_ebony",
    lidOpen: 0.62,
  },
  {
    id: "recital",
    index: 2,
    label: "03 / 07",
    title: "Recital hall",
    subtitle: "Piano Reality projection",
    body: "Recital mode lifts brilliance and hall reverb — the cabinet glows as you play, bloom answering each phrase.",
    performanceModeId: "recital",
    cameraPreset: "performance",
    finishId: "polished_ebony",
    lidOpen: 0.78,
  },
  {
    id: "profile",
    index: 3,
    label: "04 / 07",
    title: "Cabinet craft",
    subtitle: "Profile · rim · lid geometry",
    body: "A side study of the grand form — lid angle, pedal bar, and lacquer catch light from a studio key.",
    performanceModeId: "studio",
    cameraPreset: "profile",
    finishId: "ebony",
    lidOpen: 0.52,
  },
  {
    id: "night",
    index: 4,
    label: "05 / 07",
    title: "Night session",
    subtitle: "Slow orbit · muted warmth",
    body: "Night mode drifts the camera in a gentle orbit — late-hour practice with restrained bloom and deep vignette.",
    performanceModeId: "night",
    cameraPreset: "orbit",
    finishId: "polished_ebony",
    lidOpen: 0.68,
  },
  {
    id: "showcase",
    index: 5,
    label: "06 / 07",
    title: "Showroom rim",
    subtitle: "Accent spin · wide stereo",
    body: "Showcase choreography drives a rim light around the cabinet — bright demo character for the dealer floor.",
    performanceModeId: "showcase",
    cameraPreset: "performance",
    finishId: "polished_ebony",
    lidOpen: 0.88,
  },
  {
    id: "finale",
    index: 6,
    label: "07 / 07",
    title: "Your room",
    subtitle: "Ambient space · full lid",
    body: "The sequence closes on an ambient orbit — lush tails, open lid, and the GP-9 settled into your living space.",
    performanceModeId: "ambient",
    cameraPreset: "orbit",
    finishId: "white",
    lidOpen: 0.72,
  },
];

export const GP9_CINEMATIC_SHOT_COUNT = GP9_CINEMATIC_SHOTS.length;

/** Demo MIDI notes highlighted on the keyboard shot. */
export const GP9_CINEMATIC_DEMO_NOTES = [60, 64, 67, 72] as const;
