export interface HeroInlineStyle {
  color?: string;
  backgroundColor?: string;
}

export interface HeroStripeLink {
  href: string;
  label: string;
  hpSection: string;
  hpSlot: number;
}

export interface HeroTriptychConfig {
  pool: string[];
  leftIndices: number[];
  rightIndices: number[];
  initialRightIndex: number;
}

export interface HeroSlidesContent {
  testId: string;
  heroClassName: string;
  intervalMs: number;
  mobileMediaQuery: string;
  overlayId: string;
  triptych: HeroTriptychConfig;
  mainHref: string;
  mainHpSection: string;
  mainHpSlot: number;
  eyebrow: {
    text: string;
    style: HeroInlineStyle;
  };
  headline: {
    src: string;
    alt: string;
  };
  subhead: {
    text: string;
    style: HeroInlineStyle;
  };
  cta: {
    text: string;
    style: HeroInlineStyle;
  };
  stripe: {
    style: HeroInlineStyle;
    strongText: string;
    links: HeroStripeLink[];
  };
  visuallyHiddenTitle: string;
  expectedSectionIds: string;
}

const SUPERHERO_PROMO =
  "promo_creative=hero&promo_id=promotion_drum_month_2026&promo_name=promotion_drum_month_2026&promo_position=superhero";

const FINANCING_STRIPE_PROMO =
  "promo_creative=financing_stripe&promo_id=promotion_drum_month_2026&promo_name=promotion_drum_month_2026&promo_position=superhero";

const IMAGE_BASE =
  "/images/m/promotions/2026/0603-Drum-Month/homepage/superhero";

/** Homepage Drum Month triptych superhero (`main-head` legacy). */
export const HERO_SLIDES: HeroSlidesContent = {
  testId: "sw-hero-active",
  heroClassName: "sw-hero sw-hero--center sw-hero--triptych sw-hero--dark",
  intervalMs: 4000,
  mobileMediaQuery: "(max-width: 1024px)",
  overlayId: "sw-overlay-x4yhwb",
  triptych: {
    pool: [
      `${IMAGE_BASE}/0603-DrumMonth-Superhero-Images-1.jpg`,
      `${IMAGE_BASE}/0603-DrumMonth-Superhero-Images-3.jpg`,
      `${IMAGE_BASE}/0603-DrumMonth-Superhero-Images-2.jpg`,
      `${IMAGE_BASE}/0603-DrumMonth-Superhero-Images-4.jpg`,
    ],
    leftIndices: [0, 1],
    rightIndices: [2, 3],
    initialRightIndex: 0,
  },
  mainHref: `/shop/drum-month?${SUPERHERO_PROMO}`,
  mainHpSection: "superhero",
  mainHpSlot: 1,
  eyebrow: {
    text: "UP TO 55% OFF",
    style: { color: "#000", backgroundColor: "#FFF" },
  },
  headline: {
    src: "/images/m/home/takeovers/2026/drum-month/drum_month_lockup.svg",
    alt: "Headline",
  },
  subhead: {
    text: "Unbeatable deals. New brands. Exclusive gear. Free shipping.",
    style: { color: "#FFFFFF" },
  },
  cta: {
    text: "Shop Now",
    style: { backgroundColor: "#FFFFFF", color: "#080708" },
  },
  stripe: {
    style: { backgroundColor: "#080708", color: "#FFFFFF" },
    strongText: "Up to 48-month Special Financing*",
    links: [
      {
        href: `/financing?${FINANCING_STRIPE_PROMO}`,
        label: "Learn More",
        hpSection: "superhero",
        hpSlot: 2,
      },
      {
        href: `/shop/drum-month/?Financing=24+Months,36+Months,48+Months&${FINANCING_STRIPE_PROMO}`,
        label: "Shop Drum Month Offers",
        hpSection: "superhero",
        hpSlot: 3,
      },
    ],
  },
  visuallyHiddenTitle: "Find Your Next Musical Instrument at Vibe Music",
  expectedSectionIds:
    "personalization-widgets,popular-categories,sales-events,hero-tiles,suggested-products,value-adds,top-new-products,sales-engineer,suggested-gx-products,hottest-deals,research-articles,careers",
};
