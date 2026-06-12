export interface StyleStoryItem {
  id: string;
  reelUrl: string;
  videoSrc: string;
  thumbnailSrc: string;
  alt: string;
}

export const STYLE_STORY_REELS: StyleStoryItem[] = [
  {
    id: "1",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DY1irHzlrml/",
    videoSrc: "/videos/style-story/reel-1.mp4",
    thumbnailSrc: "/images/style-story/reel-1.jpg",
    alt: "Hertz Music India reel — guitar strings showcase",
  },
  {
    id: "2",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DX6yk91gCun/",
    videoSrc: "/videos/style-story/reel-2.mp4",
    thumbnailSrc: "/images/style-story/reel-2.jpg",
    alt: "Hertz Music India reel — Telecaster demo",
  },
  {
    id: "3",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXyefWnTR1u/",
    videoSrc: "/videos/style-story/reel-3.mp4",
    thumbnailSrc: "/images/style-story/reel-3.jpg",
    alt: "Hertz Music India reel — bass guitar performance",
  },
  {
    id: "4",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DZDKCzlIvux/",
    videoSrc: "/videos/style-story/reel-4.mp4",
    thumbnailSrc: "/images/style-story/reel-4.jpg",
    alt: "Hertz Music India reel — electric guitar in store",
  },
  {
    id: "5",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXeh-R9D-s-/",
    videoSrc: "/videos/style-story/reel-5.mp4",
    thumbnailSrc: "/images/style-story/reel-5.jpg",
    alt: "Hertz Music India reel — drum kit showcase",
  },
  {
    id: "6",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXMnMBDyvdP/",
    videoSrc: "/videos/style-story/reel-6.mp4",
    thumbnailSrc: "/images/style-story/reel-6.jpg",
    alt: "Hertz Music India reel — studio gear highlight",
  },
];

export const STYLE_STORY = {
  sectionId: "shop-style-story",
  heading: "SHOP STYLE STORY",
  reels: STYLE_STORY_REELS,
} as const;
