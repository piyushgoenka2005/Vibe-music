import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";

export const HELP_WIDGET_LINKS = [
  { label: "WhatsApp support", href: BRAND.whatsappUrl, icon: "whatsapp", external: true },
  { label: "Track your order", href: ROUTES.trackOrder, icon: "package" },
  { label: "Returns & exchanges", href: ROUTES.page("returns"), icon: "rotate" },
  { label: "Shipping policy", href: ROUTES.page("shipping"), icon: "truck" },
  { label: "Contact support", href: ROUTES.contact, icon: "headset" },
  {
    label: "Privacy policy",
    href: ROUTES.page("privacy"),
    icon: "shield",
  },
] as const;

export const HELP_WIDGET_HOURS = [
  { day: "Mon – Fri", time: "10 AM – 7 PM IST" },
  { day: "Saturday", time: "10 AM – 6 PM IST" },
  { day: "Sunday", time: "11 AM – 5 PM IST" },
] as const;

export const HELP_WIDGET_INTRO = "Musician advisors for gear, orders, and setup.";

export const HELP_WIDGET_DISCLAIMER =
  "Support requests may be retained for training, quality, and service improvement.";
