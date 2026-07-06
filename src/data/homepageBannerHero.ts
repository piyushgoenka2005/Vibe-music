import { ROUTES, categoryPath } from "@/lib/routes";

export interface HomepageBannerSlide {
  id: string;
  src: string;
  alt: string;
  href: string;
}

export const HOMEPAGE_BANNER_ROTATION_MS = 3500;

/** Client-approved homepage hero banner carousel slides. */
export const HOMEPAGE_BANNER_SLIDES: HomepageBannerSlide[] = [
  {
    id: "banner-1",
    src: "/images/banner-1.png",
    alt: "Sound That Moves You — premium instruments at Vibe Music",
    href: ROUTES.search,
  },
  {
    id: "banner-2",
    src: "/images/banner-2.png",
    alt: "Play More. Feel More. Live Music — shop guitars at Vibe Music",
    href: categoryPath("guitars"),
  },
  {
    id: "banner-3",
    src: "/images/banner-3.png",
    alt: "Find Your Perfect Sound — grand piano collection at Vibe Music",
    href: categoryPath("keyboards-pianos"),
  },
  {
    id: "banner-4",
    src: "/images/banner-4.png",
    alt: "Find Your Perfect Sound — premium acoustic guitars at Vibe Music",
    href: categoryPath("guitars"),
  },
];
