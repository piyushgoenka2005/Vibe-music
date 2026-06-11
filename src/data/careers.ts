export interface CareersFeaturedImage {
  src: string;
  alt: string;
  hidden?: boolean;
}

export interface CareersCta {
  href: string;
  label: string;
  variant: "primary" | "secondary";
}

export interface CareersContent {
  sectionId: string;
  featuredImages: CareersFeaturedImage[];
  bannerImage: {
    src: string;
    alt: string;
  };
  title: string;
  copy: string;
  ctas: CareersCta[];
}

const IMAGE_BASE =
  "/images/m/careers/homepage_2025";

function careersImage(fileName: string): string {
  return `${IMAGE_BASE}/${fileName}?format=webp&optimize=medium`;
}

/** Homepage careers recruitment block (`#careers`). */
export const CAREERS: CareersContent = {
  sectionId: "careers",
  featuredImages: [
    {
      src: careersImage("hc-careers__guitar-repair.jpg"),
      alt: "Guitar repair employee",
    },
    {
      src: careersImage("hc-careers__se.jpg"),
      alt: "Sales engineer",
      hidden: true,
    },
    {
      src: careersImage("hc-careers__tech-support.jpg"),
      alt: "Tech support employee",
      hidden: true,
    },
  ],
  bannerImage: {
    src: careersImage("hc-careers__banner.png"),
    alt: "Guitar display banner",
  },
  title: "You shop here, why not work here?",
  copy:
    "If you're searching for a company founded on passion where you can accomplish the best work of your life, then join our hard-working, talented team — and the #1 online music retailer in the country — and see why we call a career at Vibe Music our Full-time Dream.",
  ctas: [
    {
      href: "/careers/openings/",
      label: "All Openings",
      variant: "primary",
    },
    {
      href: "/careers",
      label: "Our Culture",
      variant: "secondary",
    },
  ],
};
