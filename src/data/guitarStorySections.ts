export interface GuitarStoryBanner {
  id: string;
  imageSrc: string;
  imageAlt: string;
}

/** Fixed guitar story banners shown on all guitar product pages. */
export const GUITAR_STORY_BANNERS: GuitarStoryBanner[] = [
  {
    id: "guitar-story-1",
    imageSrc: "/images/guitar-1.webp",
    imageAlt: "An integrated coil-tap for total tonal freedom",
  },
  {
    id: "guitar-story-2",
    imageSrc: "/images/guitar-2.webp",
    imageAlt: "Get the warmth of single-coils. Keep the crunch of a humbucker",
  },
];
