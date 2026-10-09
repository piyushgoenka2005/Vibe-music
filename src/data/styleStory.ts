import { getMirroredReelVideoUrl } from "@/data/reelVideos";

export interface StyleStoryItem {
  id: string;
  reelUrl: string;
  /** Handle shown on the card — matches the Instagram account that owns the reel. */
  reelInstagramHandle: string;
  videoSrc: string;
  thumbnailSrc: string;
  alt: string;
}

const FALLBACK_THUMBS = [
  "/images/guitar-1.webp",
  "/images/guitar-2.webp",
  "/images/drum-1.webp",
  "/images/drum-2.webp",
] as const;

export const STYLE_STORY_REELS: StyleStoryItem[] = [
  {
    id: "1",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DY1irHzlrml/",
    reelInstagramHandle: "@hertzmusicindia",
    videoSrc: getMirroredReelVideoUrl(0),
    thumbnailSrc: FALLBACK_THUMBS[0],
    alt: "Hertz Music India reel — guitar strings showcase",
  },
  {
    id: "2",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DX6yk91gCun/",
    reelInstagramHandle: "@hertzmusicindia",
    videoSrc: getMirroredReelVideoUrl(1),
    thumbnailSrc: FALLBACK_THUMBS[1],
    alt: "Hertz Music India reel — Telecaster demo",
  },
  {
    id: "3",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXyefWnTR1u/",
    reelInstagramHandle: "@hertzmusicindia",
    videoSrc: getMirroredReelVideoUrl(2),
    thumbnailSrc: FALLBACK_THUMBS[0],
    alt: "Hertz Music India reel — bass guitar performance",
  },
  {
    id: "4",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DZDKCzlIvux/",
    reelInstagramHandle: "@hertzmusicindia",
    videoSrc: getMirroredReelVideoUrl(3),
    thumbnailSrc: FALLBACK_THUMBS[1],
    alt: "Hertz Music India reel — electric guitar in store",
  },
  {
    id: "5",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXeh-R9D-s-/",
    reelInstagramHandle: "@hertzmusicindia",
    videoSrc: getMirroredReelVideoUrl(4),
    thumbnailSrc: FALLBACK_THUMBS[2],
    alt: "Hertz Music India reel — drum kit showcase",
  },
  {
    id: "6",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXMnMBDyvdP/",
    reelInstagramHandle: "@hertzmusicindia",
    videoSrc: getMirroredReelVideoUrl(5),
    thumbnailSrc: FALLBACK_THUMBS[3],
    alt: "Hertz Music India reel — studio gear highlight",
  },
];

export const STYLE_STORY = {
  sectionId: "shop-style-story",
  heading: "SHOP STYLE STORY",
  reels: STYLE_STORY_REELS,
} as const;
