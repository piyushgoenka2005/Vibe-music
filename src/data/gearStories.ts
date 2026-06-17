import type { GearStorySeed } from "@/types/gear-story";
import { getMirroredReelVideoUrl } from "@/data/reelVideos";

export const GEAR_STORIES_SECTION = {
  title: "Gear style stories",
  subtitle: "Discover instruments in action.",
} as const;

/** CMS-ready seeds — enriched with live catalog data via gearStoryService. */
export const GEAR_STORY_SEEDS: GearStorySeed[] = [
  {
    id: "gs-1",
    title: "Player Stratocaster",
    productId: "prod-1",
    videoUrl: getMirroredReelVideoUrl(0),
    description:
      "Classic single-coil tone with modern playability — the Fender Player Stratocaster delivers stage-ready performance for studio and live sessions.",
    features: [
      "Player Series Alnico 5 pickups",
      "Modern \"C\"-shape maple neck",
      "2-point tremolo bridge",
      "Alder body with gloss finish",
      "Professional setup included",
    ],
  },
  {
    id: "gs-2",
    title: "Player Telecaster",
    productId: "prod-2",
    videoUrl: getMirroredReelVideoUrl(1),
    description:
      "Butterscotch blonde finish and unmistakable twang — the Player Telecaster pairs timeless design with crisp, articulate tone.",
    features: [
      "Player Series Tele pickups",
      "Maple neck & fingerboard",
      "String-through-body bridge",
      "Classic butterscotch finish",
      "Inspected by Vibe Music techs",
    ],
  },
  {
    id: "gs-3",
    title: "Les Paul Standard '50s",
    productId: "prod-4",
    videoUrl: getMirroredReelVideoUrl(2),
    description:
      "Heritage cherry finish and legendary sustain — the Gibson Les Paul Standard '50s captures thick, singing rock tone.",
    features: [
      "Mahogany body with maple cap",
      "Burstbucker pickups",
      "Vintage tulip tuners",
      "Nitrocellulose lacquer finish",
      "Includes hardshell case",
    ],
  },
  {
    id: "gs-4",
    title: "Artcore AS73",
    productId: "prod-12",
    videoUrl: getMirroredReelVideoUrl(3),
    description:
      "Warm semi-hollow resonance with smooth playability — ideal for jazz, blues, and soulful grooves.",
    features: [
      "Laminated maple top & back",
      "ACH1 neck & ACH2 bridge pickups",
      "Quik Change III tailpiece",
      "Tobacco brown finish",
      "Ready to gig out of the box",
    ],
  },
  {
    id: "gs-5",
    title: "V-Drums TD516",
    productId: "prod-21",
    videoUrl: getMirroredReelVideoUrl(4),
    description:
      "Professional electronic kit feel with acoustic-level response and expressive dynamics for home studio or stage.",
    features: [
      "Digital snare with multi-zone sensing",
      "TD-27 sound module",
      "Prism mesh tom pads",
      "Kick pad with noise reduction",
      "Bluetooth audio & MIDI",
    ],
  },
  {
    id: "gs-6",
    title: "HD 600",
    productId: "prod-36",
    videoUrl: getMirroredReelVideoUrl(5),
    description:
      "Reference-grade open-back headphones trusted by engineers for natural, uncolored critical listening.",
    features: [
      "Open-back circumaural design",
      "Lightweight aluminum voice coils",
      "Detachable OFC copper cable",
      "Replaceable ear pads",
      "Ideal for mixing & mastering",
    ],
  },
];
