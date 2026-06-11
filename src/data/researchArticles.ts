export interface ResearchArticleImage {
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
  width: number;
  height: number;
}

export interface ResearchArticleItem {
  id: string;
  href: string;
  title: string;
  authorDate: string;
  image: ResearchArticleImage;
  hpSlot: number;
}

export interface ResearchArticlesHero {
  logoSrc: string;
  logoAlt: string;
  logoWidth: number;
  logoHeight: number;
  copy: string;
  ctaHref: string;
  ctaLabel: string;
  hpSlot: number;
}

export interface ResearchArticlesContent {
  sectionId: string;
  heading: string;
  hero: ResearchArticlesHero;
  featuredArticle: ResearchArticleItem;
  articles: ResearchArticleItem[];
}

const FEATURED_WIDTHS = [746, 559, 373, 340, 183, 149] as const;
const ARTICLE_WIDTHS = [256, 192, 128, 81] as const;

const FEATURED_SIZES = "(max-width:768px) 100vw, calc(50vw - 14px)";
const ARTICLE_SIZES =
  "(max-width:768px) calc(50vw - 7px), calc(25vw - 14px)";

function insyncSrcSet(path: string, widths: readonly number[]): string {
  return widths
    .map(
      (width) =>
        `/images/m/insync/${path}?width=${width}&height=549&fit=cover&format=jpg&optimize=high&auto=webp&quality=70 ${width}w`
    )
    .join(", ");
}

function featuredImage(
  path: string,
  alt: string
): ResearchArticleImage {
  return {
    src: `/images/m/insync/${path}?width=1050&height=549&fit=cover`,
    srcSet: insyncSrcSet(path, FEATURED_WIDTHS),
    sizes: FEATURED_SIZES,
    alt,
    width: 500,
    height: 375,
  };
}

function articleImage(path: string, alt: string): ResearchArticleImage {
  return {
    src: `/images/m/insync/${path}?width=1050&height=549&fit=cover&format=webp`,
    srcSet: insyncSrcSet(path, ARTICLE_WIDTHS),
    sizes: ARTICLE_SIZES,
    alt,
    width: 300,
    height: 200,
  };
}

/** Homepage inSync research grid (`#research-articles`). */
export const RESEARCH_ARTICLES: ResearchArticlesContent = {
  sectionId: "research-articles",
  heading: "Your Research Destination",
  hero: {
    logoSrc:
      "/images/insync/assets/insync-logo-inverted.svg",
    logoAlt: "inSync logo",
    logoWidth: 242,
    logoHeight: 61,
    copy:
      "Browse 30,000+ Gear reviews, tips and tricks, how-to articles and more!",
    ctaHref: "/insync",
    ctaLabel: "Explore Insync",
    hpSlot: 1,
  },
  featuredArticle: {
    id: "line-6-stadium-xl",
    href: "/insync/line-6-stadium-xl-the-future-of-modeling-is-here/",
    title: "Line 6 Helix Stadium XL | The Future of Modeling is HERE",
    authorDate: "Jun 17, 2025",
    image: featuredImage(
      "2025/06/250617_HelixLine6_01-1.jpg",
      "Line 6 Helix Stadium XL | The Future of Modeling is HERE"
    ),
    hpSlot: 2,
  },
  articles: [
    {
      id: "five-ways-drones",
      href: "/insync/five-ways-drones-can-elevate-worship/",
      title: "Five Ways Drones Can Elevate Worship",
      authorDate: " Jun 2, 2026",
      image: articleImage(
        "2026/06/0602-FiveWaysDronesCanElevateYourChurch-01.jpg",
        "Five Ways Drones Can Elevate Worship"
      ),
      hpSlot: 2,
    },
    {
      id: "using-dacs-amps",
      href: "/insync/using-dacs-amps-with-headphones/",
      title: "Using DACs & Amps with Headphones",
      authorDate: " May 29, 2026",
      image: articleImage(
        "2026/05/IN250008_Usings_DACs_And_Amps_With_Headphones_1600x838_026.jpg",
        "Using DACs & Amps with Headphones"
      ),
      hpSlot: 3,
    },
    {
      id: "best-vocal-mics",
      href: "/insync/best-vocal-mics-under-1000/",
      title: "10 Best Vocal Mics Under $1,000",
      authorDate: " May 27, 2026",
      image: articleImage(
        "2020/02/10-Best-Vocal-Mics-Under-1000-Featured-Image.jpg",
        "10 Best Vocal Mics Under $1,000"
      ),
      hpSlot: 4,
    },
    {
      id: "helix-stadium-worship",
      href: "/insync/choosing-between-helix-stadium-floor-stadium-xl-for-worship-which-is-best-for-you/",
      title:
        "Choosing Between Helix, Stadium Floor & Stadium XL for Worship: Which Is Best for You?",
      authorDate: " May 14, 2026",
      image: articleImage(
        "2026/05/26IN0177_BestLIne6-InSync-Article-1600x838-1.jpg",
        "Choosing Between Helix, Stadium Floor & Stadium XL for Worship: Which Is Best for You?"
      ),
      hpSlot: 5,
    },
  ],
};
