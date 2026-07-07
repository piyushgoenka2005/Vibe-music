import { productPath, ROUTES } from "@/lib/routes";

const ROLAND_GP9_GALLERY =
  "https://static.roland.com/products/gp-9/images/gallery";
const ROLAND_GP9_PRODUCT = `${ROLAND_GP9_GALLERY}/gp-9_front_gal.jpg`;

const HERTZ_GUITAR_FRONT =
  "https://res.cloudinary.com/piyushgoenka/image/upload/v1782292587/products/guitars/hertz-hza4503-hza4503/01-hza-4503-na-amazonfront.png";

const ADEON_PA_FRONT =
  "https://res.cloudinary.com/piyushgoenka/image/upload/v1782290990/products/live-sound-lighting/adeon-ad12-dsp-ad12-dsp/01-ad12.jpg";

export interface HomepageTopProduct {
  id: string;
  title: string;
  excerpt: string;
  tags: [string, string?];
  href: string;
  image: string;
  brandLabel: string;
  /** When set, the server component may swap in the live catalog image. */
  productSlug?: string;
  /** Keep the curated `image` instead of replacing it from catalog. */
  pinImage?: boolean;
  imageFit?: "cover" | "contain";
  imageObjectPosition?: string;
  imageMediaClass?: string;
}

export const HOMEPAGE_TOP_PRODUCTS: HomepageTopProduct[] = [
  {
    id: "grand-piano-9",
    title: "Grand Piano — 9",
    excerpt:
      "Roland GP-9 digital grand piano with hybrid key action, immersive sound, and home-concert elegance.",
    tags: ["Pianos", "Featured"],
    href: ROUTES.gp9,
    image: ROLAND_GP9_PRODUCT,
    brandLabel: "Roland",
    pinImage: true,
    imageFit: "contain",
    imageObjectPosition: "center center",
  },
  {
    id: "top-guitar",
    title: "Top Guitar",
    excerpt:
      "Acoustic and electric guitars from Hertz and leading brands — built for stage, studio, and everyday play.",
    tags: ["Guitars", "Bestseller"],
    href: productPath("hertz-hza4503-hza4503"),
    image: HERTZ_GUITAR_FRONT,
    brandLabel: "HERTZ",
    productSlug: "hertz-hza4503-hza4503",
    pinImage: true,
    imageFit: "contain",
    imageObjectPosition: "center center",
    imageMediaClass: "blog-teaser__media--instrument",
  },
  {
    id: "pa-speaker",
    title: "PA Speaker",
    excerpt:
      "Professional active PA speakers with DSP control for DJs, live performance, karaoke, and venue sound.",
    tags: ["Live Sound", "PA Systems"],
    href: productPath("adeon-ad12-dsp-ad12-dsp"),
    image: ADEON_PA_FRONT,
    brandLabel: "ADEON",
    productSlug: "adeon-ad12-dsp-ad12-dsp",
    pinImage: true,
    imageFit: "contain",
    imageObjectPosition: "center center",
  },
];
export const HOMEPAGE_TOP_PRODUCTS_CTA = ROUTES.search;
