import type { AplusStoryBanner } from "@/components/common/AplusStoryBanners";

import { categoryPath } from "@/lib/routes";

/** Full-width A+ story banners on the homepage. */
export const HOMEPAGE_APLUS_BANNERS: AplusStoryBanner[] = [
  {
    id: "homepage-guitar-1",
    imageSrc: "/images/guitar-1.webp",
    imageAlt: "An integrated coil-tap for total tonal freedom",
    href: categoryPath("guitars"),
  },
  {
    id: "homepage-guitar-2",
    imageSrc: "/images/guitar-2.webp",
    imageAlt: "Get the warmth of single-coils. Keep the crunch of a humbucker",
    href: categoryPath("guitars"),
  },
  {
    id: "homepage-drum-1",
    imageSrc: "/images/drum-1.webp",
    imageAlt: "Professional drum kits built for stage-ready performance",
    href: categoryPath("drums-percussion"),
  },
  {
    id: "homepage-drum-2",
    imageSrc: "/images/drum-2.webp",
    imageAlt: "Responsive shells and hardware for every playing style",
    href: categoryPath("drums-percussion"),
  },
];
