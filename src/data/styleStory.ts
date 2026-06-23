export interface StyleStoryItem {
  id: string;
  reelUrl: string;
  videoSrc: string;
  thumbnailSrc: string;
  alt: string;
}

const PLACEHOLDER_THUMBNAILS = [
  "/images/guitar-1.webp",
  "/images/guitar-2.webp",
] as const;

export const STYLE_STORY_REELS: StyleStoryItem[] = [
  {
    id: "1",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DY1irHzlrml/",
    videoSrc: "",
    thumbnailSrc: PLACEHOLDER_THUMBNAILS[0],
    alt: "Hertz Music India reel — guitar strings showcase",
  },
  {
    id: "2",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DX6yk91gCun/",
    videoSrc: "",
    thumbnailSrc: PLACEHOLDER_THUMBNAILS[1],
    alt: "Hertz Music India reel — Telecaster demo",
  },
  {
    id: "3",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXyefWnTR1u/",
    videoSrc: "",
    thumbnailSrc: PLACEHOLDER_THUMBNAILS[0],
    alt: "Hertz Music India reel — bass guitar performance",
  },
  {
    id: "4",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DZDKCzlIvux/",
    videoSrc: "",
    thumbnailSrc: PLACEHOLDER_THUMBNAILS[1],
    alt: "Hertz Music India reel — electric guitar in store",
  },
  {
    id: "5",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXeh-R9D-s-/",
    videoSrc: "",
    thumbnailSrc: PLACEHOLDER_THUMBNAILS[0],
    alt: "Hertz Music India reel — drum kit showcase",
  },
  {
    id: "6",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXMnMBDyvdP/",
    videoSrc: "",
    thumbnailSrc: PLACEHOLDER_THUMBNAILS[1],
    alt: "Hertz Music India reel — studio gear highlight",
  },
];

export const STYLE_STORY = {
  sectionId: "shop-style-story",
  heading: "SHOP STYLE STORY",
  reels: STYLE_STORY_REELS,
} as const;
