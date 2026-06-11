export type ValueAddIconId =
  | "free-shipping"
  | "gear-advisor"
  | "guitar-inspection"
  | "price-protection"
  | "tech-support"
  | "warranty"
  | "financing";

export interface ValueAddItem {
  id: string;
  iconId: ValueAddIconId;
  href: string;
  dataLog: string;
  hpSection: string;
  hpSlot: number;
  title: string;
  subtitle: string;
  subtitleSpan?: string;
  ctaLabel: string;
}

export interface ValueAddsContent {
  sectionId: string;
  heading: string;
  items: ValueAddItem[];
}

export const VALUE_ADDS: ValueAddsContent = {
  sectionId: "value-adds",
  heading: "Get More at Vibe Music",
  items: [
    {
      id: "free-shipping",
      iconId: "free-shipping",
      href: "/about/free-shipping/",
      dataLog: "Free Shipping",
      hpSection: "get-more",
      hpSlot: 1,
      title: "Fast, FREE Shipping",
      subtitle: "Even on the small stuff.",
      ctaLabel: "Learn More",
    },
    {
      id: "gear-advisor",
      iconId: "gear-advisor",
      href: "about/sales-engineers/",
      dataLog: "Gear Advisors",
      hpSection: "get-more",
      hpSlot: 2,
      title: "Dedicated Gear Advisor",
      subtitle: "Helping you buy music gear with confidence.",
      ctaLabel: "Learn More",
    },
    {
      id: "guitar-inspection",
      iconId: "guitar-inspection",
      href: "/about/guitars/",
      dataLog: "55 point",
      hpSection: "inspection",
      hpSlot: 3,
      title: "55-point Guitar Inspection",
      subtitle: "Guitar perfection ",
      subtitleSpan: "right out of the box.",
      ctaLabel: "Learn More",
    },
    {
      id: "price-protection",
      iconId: "price-protection",
      href: "/about/price-protection/",
      dataLog: "Price Protection",
      hpSection: "get-more",
      hpSlot: 4,
      title: "Price Protection",
      subtitle: "Worry-free Shopping",
      ctaLabel: "Learn More",
    },
    {
      id: "tech-support",
      iconId: "tech-support",
      href: "/about/support/",
      dataLog: "Support",
      hpSection: "get-more",
      hpSlot: 5,
      title: "FREE Product Support",
      subtitle: "Got a question? ",
      subtitleSpan: "We're here to help.",
      ctaLabel: "Learn More",
    },
    {
      id: "warranty",
      iconId: "warranty",
      href: "/about/warranty/",
      dataLog: "Warranty",
      hpSection: "get-more",
      hpSlot: 6,
      title: "FREE 2-year Warranty",
      subtitle: "Buy with confidence.",
      ctaLabel: "Learn More",
    },
    {
      id: "financing",
      iconId: "financing",
      href: "/payments/",
      dataLog: "Financing",
      hpSection: "get-more",
      hpSlot: 7,
      title: "Easy Payments",
      subtitle: "Up to 48 Months.",
      ctaLabel: "Learn More",
    },
  ],
};
