import { ROUTES } from "@/lib/routes";

export type StatusTone = "live" | "success" | "info" | "neutral";

export const LANDING_STATS = [
  {
    value: "10K+",
    label: "Products in stock",
    status: "Updated daily",
    tone: "live" as StatusTone,
  },
  {
    value: "48hr",
    label: "Avg. dispatch time",
    status: "Shipping today",
    tone: "success" as StatusTone,
  },
  {
    value: "100%",
    label: "Genuine gear",
    status: "Brand verified",
    tone: "success" as StatusTone,
  },
  {
    value: "24/7",
    label: "Gear support",
    status: "Advisors online",
    tone: "live" as StatusTone,
  },
] as const;

export const LANDING_LIVE_TICKER = [
  "Store open — dispatching orders across India",
  "Free shipping on orders over ₹2,999",
  "Secure checkout via Razorpay · UPI · Cards · EMI",
  "1,200+ musicians served this month",
  "Track any order in under 60 seconds",
] as const;

export const LANDING_TRUST_ITEMS = [
  {
    icon: "truck" as const,
    title: "Fast delivery",
    desc: "Pan-India shipping on in-stock gear",
    status: "Active",
    tone: "success" as StatusTone,
  },
  {
    icon: "shield" as const,
    title: "Genuine products",
    desc: "Authorized brands, verified stock",
    status: "Verified",
    tone: "success" as StatusTone,
  },
  {
    icon: "return" as const,
    title: "Easy returns",
    desc: "Hassle-free support when you need it",
    status: "7-day window",
    tone: "info" as StatusTone,
  },
  {
    icon: "headphones" as const,
    title: "Expert advice",
    desc: "Real musicians on our support team",
    status: "Live chat",
    tone: "live" as StatusTone,
  },
] as const;

export const LANDING_SERVICE_STATUS = [
  {
    icon: "package" as const,
    title: "Track your order",
    desc: "Real-time status from dispatch to doorstep",
    status: "Available",
    tone: "success" as StatusTone,
    href: ROUTES.trackOrder,
    cta: "Track now",
  },
  {
    icon: "credit-card" as const,
    title: "Secure payments",
    desc: "Razorpay checkout with UPI, cards & EMI",
    status: "Protected",
    tone: "success" as StatusTone,
    href: ROUTES.checkout,
    cta: "Learn more",
  },
  {
    icon: "clock" as const,
    title: "48-hour dispatch",
    desc: "In-stock gear ships fast from our warehouses",
    status: "On schedule",
    tone: "live" as StatusTone,
    href: ROUTES.search,
    cta: "Shop in-stock",
  },
  {
    icon: "message" as const,
    title: "Gear advisors",
    desc: "Talk to musicians before you buy",
    status: "Online now",
    tone: "live" as StatusTone,
    href: `mailto:support@vibemusic.in`,
    cta: "Get help",
  },
] as const;

export const LANDING_SOCIAL_PROOF = {
  rating: "4.8",
  reviewCount: "2,400+",
  musicians: "12K+",
  cities: "120+",
  brands: "200+",
} as const;

export const LANDING_LOCATIONS = [
  {
    city: "Delhi",
    status: "Open",
    tone: "live" as StatusTone,
    image: "/images/locations/delhi.jpg",
  },
  {
    city: "Kolkata",
    status: "Open",
    tone: "live" as StatusTone,
    image: "/images/locations/kolkata.jpg",
  },
  {
    city: "Nagpur",
    status: "Open",
    tone: "live" as StatusTone,
    image: "/images/locations/nagpur.jpg",
  },
  {
    city: "North East",
    status: "Partner hub",
    tone: "info" as StatusTone,
    image: "/images/locations/north-east.jpg",
  },
  {
    city: "Mumbai",
    status: "Flagship",
    tone: "success" as StatusTone,
    image: "/images/locations/mumbai.jpg",
  },
] as const;
