import { BRAND } from "@/lib/brand";
import { ROUTES, categoryPath } from "@/lib/routes";

export interface StorefrontProgram {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

/** Discoverable Vibe Music programs — rentals, giveaways, used gear, and partner services. */
export const STOREFRONT_PROGRAMS: StorefrontProgram[] = [
  {
    id: "rentals",
    title: "Instrument rentals",
    description: "Book keyboards, PA, guitars, and studio gear by the hour, day, or week.",
    href: ROUTES.rentals,
    cta: "Browse rentals",
  },
  {
    id: "giveaway",
    title: "Giveaways",
    description: "Enter live campaigns for gear prizes and exclusive Vibe Music drops.",
    href: ROUTES.giveaway,
    cta: "View giveaways",
  },
  {
    id: "used",
    title: "Used & open-box",
    description: "Inspected pre-owned and B-stock instruments with clear condition notes.",
    href: ROUTES.used,
    cta: "Shop used gear",
  },
  {
    id: "gear-exchange",
    title: BRAND.gearExchangeName,
    description: "Trade in or consign gear with Vibe Music gear advisors.",
    href: ROUTES.gearExchange,
    cta: "Learn more",
  },
  {
    id: "studios",
    title: BRAND.studiosName,
    description: "Rehearsal rooms, recording sessions, and studio gear on rent.",
    href: ROUTES.studios,
    cta: "Studio services",
  },
  {
    id: "financing",
    title: "Payment options",
    description: "Secure Razorpay checkout with UPI, cards, and net banking.",
    href: ROUTES.financing,
    cta: "How to pay",
  },
];

/** Primary programs surfaced in header/footer/mobile nav. */
export const STOREFRONT_PROGRAM_PRIMARY_LINKS: StorefrontProgram[] = [
  STOREFRONT_PROGRAMS[0],
  STOREFRONT_PROGRAMS[1],
  STOREFRONT_PROGRAMS[2],
];

export const STUDIOS_RECORDING_CATEGORY = categoryPath("studio-recording");
