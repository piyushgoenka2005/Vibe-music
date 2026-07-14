export type TourRibbonItem = {
  headline: string;
  stamp: string;
  meta: string;
};

export type TourRibbonBand = {
  id: string;
  direction: "ltr" | "rtl";
  duration: string;
  items: TourRibbonItem[];
};

/** Truck'N Roll–style overlapping tour ticker — Vibe Music copy. */
export const TOUR_RIBBON_BANDS: TourRibbonBand[] = [
  {
    id: "band-a",
    direction: "ltr",
    duration: "42s",
    items: [
      {
        headline: "IT'S A VIBE",
        stamp: "VIBE MUSIC®",
        meta: "MUSICAL INSTRUMENTS.",
      },
      {
        headline: "STAGE READY",
        stamp: "VIBE MUSIC®",
        meta: "GUITARS · KEYS · DRUMS.",
      },
      {
        headline: "PLAY LOUD",
        stamp: "VIBE MUSIC®",
        meta: "PRO AUDIO & LIVE SOUND.",
      },
    ],
  },
  {
    id: "band-b",
    direction: "rtl",
    duration: "48s",
    items: [
      {
        headline: "NEW GEAR DAILY",
        stamp: "VIBE MUSIC®",
        meta: "AUTHORIZED BRANDS.",
      },
      {
        headline: "LOCAL PICKUP",
        stamp: "VIBE MUSIC®",
        meta: "DELHI · MUMBAI · KOLKATA.",
      },
      {
        headline: "SHIP ANYWHERE",
        stamp: "VIBE MUSIC®",
        meta: "FREE ON EVERY ORDER.",
      },
    ],
  },
  {
    id: "band-c",
    direction: "ltr",
    duration: "46s",
    items: [
      {
        headline: "STUDIO TO STAGE",
        stamp: "VIBE MUSIC®",
        meta: "PREMIUM AUDIO STORE.",
      },
      {
        headline: "YOUR SOUND",
        stamp: "VIBE MUSIC®",
        meta: "FIND IT. BUY IT. PLAY IT.",
      },
      {
        headline: "KEEP THE BEAT",
        stamp: "VIBE MUSIC®",
        meta: "OPEN BOX · DEALS · SUPPORT.",
      },
    ],
  },
];
