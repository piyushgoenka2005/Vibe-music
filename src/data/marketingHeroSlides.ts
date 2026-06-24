/** Rotating hero visuals for the split marketing hero. */

export interface MarketingHeroSlide {

  src: string;

  alt: string;

  /** Default `contain` keeps product shots fully visible; use `cover` for banner art. */

  fit?: "contain" | "cover";

  objectPosition?: string;

}



const PRODUCT = "/images/m/products/image";

const CAT = "/images/m/home/cats";



export const MARKETING_HERO_SLIDES: MarketingHeroSlide[] = [

  {

    src: "/images/Tl 6 BUTTER BLONDIE1.png",

    alt: "Hertz TL-6 electric guitar in butter blond finish",

    fit: "contain",

    objectPosition: "center center",

  },

  {

    src: "/images/Tl 6 MNT GREEN Colored New_.png",

    alt: "Hertz TL-6 electric guitar in mint green",

    fit: "contain",

    objectPosition: "center center",

  },

  {

    src: "/images/New Guitar.png",

    alt: "Fender Stratocaster electric guitar in sunburst",

    fit: "contain",

    objectPosition: "center bottom",

  },

  {

    src: `${PRODUCT}/ce349f6ddbpWnBa7UdRlNlAUJ0fhyGkXuQUKCv6V.png`,

    alt: "Akai MPC sampler and keyboard",

    fit: "contain",

    objectPosition: "center bottom",

  },

  {

    src: `${PRODUCT}/2cdf4bf761DZWztWMTXvRjefZynBO9RTcVrcDe0F.jpg`,

    alt: "Universal Audio Apollo studio interface",

    fit: "contain",

    objectPosition: "center center",

  },

  {

    src: `${CAT}/PBassAPR3SB.png`,

    alt: "Fender Precision bass guitar",

    fit: "contain",

    objectPosition: "center bottom",

  },

  {

    src: `${PRODUCT}/6c9d9ecdf8KxbYZ66Y2FbzDnGWRM90iaN4Xlc84X.jpg`,

    alt: "QSC live sound PA speaker",

    fit: "contain",

    objectPosition: "center 35%",

  },

  {

    src: "/images/big-names-deals/prs-product.png",

    alt: "PRS electric guitar in seafoam green",

    fit: "contain",

    objectPosition: "center bottom",

  },

  {

    src: `${CAT}/LM402.png`,

    alt: "Roland electronic drum module",

    fit: "contain",

    objectPosition: "center bottom",

  },

];



export const MARKETING_HERO_FALLBACK = "/images/Electric Blue Guitar.png";



export const MARKETING_HERO_ROTATE_MS = 3500;

