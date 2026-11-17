import type { BigNamesDealItem } from "@/lib/homepage/bigNamesDeals";

export const HOMEPAGE_SECTION_KEYS = [
  "premium_hero",
  "new_arrivals",
  "best_sellers",
  "trending",
  "staff_picks",
  "featured_categories",
  "browse_by_categories",
  "category_bento",
  "deals_of_the_day",
  "big_names_deals",
  "brand_strip",
  "featured_stories",
  "gear_stories",
  "shop_the_highlights",
  "gear_advisors",
  "trending_buys",
  "store_network",
  "find_your_product",
  "social_rail",
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export type HomepageSourceMode = "manual" | "auto";

export type HomepageSectionLayout =
  | "product_grid"
  | "product_carousel"
  | "category_grid"
  | "browse_category_cards"
  | "category_bento"
  | "deals_slider"
  | "brand_strip"
  | "big_names_deals"
  | "story_banners"
  | "gear_stories_reels"
  | "editorial_split"
  | "store_network_grid"
  | "find_your_product"
  | "social_rail";

export interface HomepageSection {
  id: string;
  sectionKey: HomepageSectionKey;
  title: string;
  subtitle?: string;
  accentLabel?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  isActive: boolean;
  sortOrder: number;
  sourceMode: HomepageSourceMode;
  maxItems: number;
  layout: HomepageSectionLayout;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageSectionItem {
  id: string;
  sectionKey: HomepageSectionKey;
  sortOrder: number;
  isActive: boolean;
  productId?: string;
  categorySlug?: string;
  brandId?: string;
  customImage?: string;
  customTitle?: string;
  customHref?: string;
  badgeLabel?: string;
  offerText?: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageProductItem {
  id: string;
  slug: string;
  brand: string;
  name: string;
  price: number;
  salePrice?: number | null;
  image: string;
  imageFallback?: string;
  imageAlt: string;
  rating: number;
  reviewCount: number;
  href: string;
  badgeLabel?: string;
  offerText?: string;
  rank?: number;
  requiresVariantSelection?: boolean;
}

export interface HomepageCategoryItem {
  id: string;
  slug: string;
  title: string;
  href: string;
  imageSrc: string;
  badge?: string;
  /** Subcategory line (category bento). */
  desc?: string;
  /** Brands line (category bento). */
  brands?: string;
  /** Product count line (category bento). */
  productCount?: string;
}

export interface HomepageBrandItem {
  id: string;
  name: string;
  slug: string;
  href: string;
  logoUrl?: string;
}

export interface StoreLocationItem {
  id: string;
  name: string;
  city: string;
  address?: string;
  customImage?: string;
  customTitle?: string;
  badgeLabel?: string;
  contactLink?: string;
  sortOrder: number;
}

export interface GearReelItem {
  id: string;
  posterUrl: string;
  title: string;
  description?: string;
  bulletFeatures?: string[];
  videoUrl: string;
  instagramHandle?: string;
  instagramLink?: string;
  productId?: string;
  badgeLabel?: string;
  sortOrder: number;
}

export interface ResolvedHomepageSection {
  key: HomepageSectionKey;
  sectionId: string;
  title: string;
  subtitle?: string;
  accentLabel?: string;
  ctaText?: string;
  ctaLink?: string;
  layout: HomepageSectionLayout;
  products?: HomepageProductItem[];
  categories?: HomepageCategoryItem[];
  brands?: HomepageBrandItem[];
  stores?: StoreLocationItem[];
  reels?: GearReelItem[];
}

export interface PublicBigNamesDealsData {
  isActive: boolean;
  eyebrow: string;
  headline: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  items: BigNamesDealItem[];
}

export interface PublicHomepageData {
  sections: ResolvedHomepageSection[];
  fetchedAt: string;
}

export type CreateHomepageSectionInput = Pick<
  HomepageSection,
  | "sectionKey"
  | "title"
  | "subtitle"
  | "accentLabel"
  | "ctaText"
  | "ctaLink"
  | "secondaryCtaText"
  | "secondaryCtaLink"
  | "isActive"
  | "sortOrder"
  | "sourceMode"
  | "maxItems"
  | "layout"
>;

export type UpdateHomepageSectionInput = Partial<
  Omit<HomepageSection, "id" | "sectionKey" | "createdAt" | "updatedAt">
>;

export interface CreateHomepageSectionItemInput {
  sectionKey: HomepageSectionKey;
  sortOrder?: number;
  isActive?: boolean;
  productId?: string;
  categorySlug?: string;
  brandId?: string;
  customImage?: string;
  customTitle?: string;
  customHref?: string;
  badgeLabel?: string;
  offerText?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export type UpdateHomepageSectionItemInput = Partial<
  Omit<HomepageSectionItem, "id" | "sectionKey" | "createdAt" | "updatedAt">
>;

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionKey, string> = {
  premium_hero: "Premium Hero",
  new_arrivals: "New Arrivals",
  best_sellers: "Best Sellers",
  trending: "Trending",
  staff_picks: "Staff Picks",
  featured_categories: "Popular Categories",
  browse_by_categories: "Browse by Categories",
  category_bento: "Category Discover Cards",
  deals_of_the_day: "Deals Of The Day",
  big_names_deals: "Big Names / Serious Savings",
  brand_strip: "Brand Strip",
  featured_stories: "Featured Stories (A+ Banners)",
  gear_stories: "Gear Style Reels",
  shop_the_highlights: "Shop the Highlights",
  gear_advisors: "Gear Advisors (Editorial)",
  trending_buys: "Buy What's Trending",
  store_network: "Store Network",
  find_your_product: "Find Your Product",
  social_rail: "Social Rail (Sidebar)",
};

export const DEFAULT_HOMEPAGE_SECTIONS: CreateHomepageSectionInput[] = [
  {
    sectionKey: "premium_hero",
    title: "Sound better\nPlay louder\nShip faster.",
    subtitle:
      "Musical instruments, pro audio, and studio essentials — curated for creators who want gear that keeps up.",
    ctaText: "Shop all gear",
    ctaLink: "/search",
    secondaryCtaText: "View deals",
    secondaryCtaLink: "/search/results?q=deals",
    isActive: true,
    sortOrder: -1,
    sourceMode: "manual",
    maxItems: 4,
    layout: "product_grid",
  },
  {
    sectionKey: "new_arrivals",
    title: "Top New Products",
    subtitle: "Fresh releases and just-landed gear from the brands you trust.",
    accentLabel: "New arrivals",
    ctaText: "Shop All New Gear",
    ctaLink: "/search/results?q=new",
    isActive: true,
    sortOrder: 0,
    sourceMode: "auto",
    maxItems: 8,
    layout: "product_grid",
  },
  {
    sectionKey: "best_sellers",
    title: "Best Sellers",
    ctaText: "View All Best Sellers",
    ctaLink: "/search/results?q=best+sellers",
    isActive: true,
    sortOrder: 1,
    sourceMode: "auto",
    maxItems: 8,
    layout: "product_carousel",
  },
  {
    sectionKey: "trending",
    title: "Trending Now",
    subtitle:
      "Buy what's trending. In-stock gear other musicians are shopping right now — products only, ready to add to cart.",
    ctaText: "Shop all trending",
    ctaLink: "/search/results?q=trending",
    isActive: true,
    sortOrder: 2,
    sourceMode: "manual",
    maxItems: 8,
    layout: "product_carousel",
  },
  {
    sectionKey: "staff_picks",
    title: "Staff Picks",
    subtitle: "Hand-picked by our team for practice rooms, stages, and studios.",
    ctaText: "Shop all products",
    ctaLink: "/search",
    isActive: true,
    sortOrder: 3,
    sourceMode: "auto",
    maxItems: 8,
    layout: "product_carousel",
  },
  {
    sectionKey: "featured_categories",
    title: "Popular Categories",
    ctaText: "Browse All Categories",
    ctaLink: "/category",
    isActive: true,
    sortOrder: 4,
    sourceMode: "manual",
    maxItems: 12,
    layout: "category_grid",
  },
  {
    sectionKey: "browse_by_categories",
    title: "Browse by Categories",
    ctaText: "View All Gear",
    ctaLink: "/category",
    isActive: true,
    sortOrder: 5,
    sourceMode: "manual",
    maxItems: 12,
    layout: "browse_category_cards",
  },
  {
    sectionKey: "category_bento",
    title: "Shop by Category",
    accentLabel: "Explore Category",
    ctaText: "Browse all categories",
    ctaLink: "/category",
    isActive: true,
    sortOrder: 6,
    sourceMode: "manual",
    maxItems: 12,
    layout: "category_bento",
  },
  {
    sectionKey: "deals_of_the_day",
    title: "Deals Of The Day",
    accentLabel: "Limited Time",
    ctaText: "Shop All Deals",
    ctaLink: "/deals",
    isActive: true,
    sortOrder: 7,
    sourceMode: "auto",
    maxItems: 8,
    layout: "deals_slider",
  },
  {
    sectionKey: "big_names_deals",
    title: "Big names. Serious savings.",
    subtitle: "Find all the top brands you already love, at prices that simply can't be beat",
    accentLabel: "Shop top brands",
    ctaText: "Shop All Deals",
    ctaLink: "/deals",
    isActive: true,
    sortOrder: 8,
    sourceMode: "manual",
    maxItems: 5,
    layout: "big_names_deals",
  },
  {
    sectionKey: "brand_strip",
    title: "Shop Top Brands",
    isActive: true,
    sortOrder: 9,
    sourceMode: "manual",
    maxItems: 12,
    layout: "brand_strip",
  },
  {
    sectionKey: "shop_the_highlights",
    title: "Shop the highlights",
    subtitle: "Grand pianos, guitars, and live sound - hand-picked in-stock gear from our catalog.",
    ctaText: "View all products",
    ctaLink: "/search",
    isActive: true,
    sortOrder: 10,
    sourceMode: "manual",
    maxItems: 3,
    layout: "product_grid",
  },
  {
    sectionKey: "featured_stories",
    title: "Featured Gear Stories",
    subtitle: "Deep dives and tonal versatility from our showcase collections",
    isActive: true,
    sortOrder: 11,
    sourceMode: "manual",
    maxItems: 8,
    layout: "story_banners",
  },
  {
    sectionKey: "gear_stories",
    title: "Gear style stories",
    subtitle: "Discover instruments in action.",
    isActive: true,
    sortOrder: 12,
    sourceMode: "manual",
    maxItems: 12,
    layout: "gear_stories_reels",
  },
  {
    sectionKey: "gear_advisors",
    title: "Gear advisors, not a warehouse",
    subtitle: "Pro gear. Honest advice. Delivered across India.",
    accentLabel: "GEAR ADVISORS, NOT A WAREHOUSE",
    ctaText: "Explore studio gear",
    ctaLink: "/category/studio-recording",
    isActive: true,
    sortOrder: 12,
    sourceMode: "manual",
    maxItems: 1,
    layout: "editorial_split",
  },
  {
    sectionKey: "store_network",
    title: "Discover our locations",
    subtitle: "Store hours vary by location — contact an advisor before visiting.",
    accentLabel: "Store Network",
    ctaText: "Contact a store advisor",
    ctaLink: "#contact",
    isActive: true,
    sortOrder: 13,
    sourceMode: "manual",
    maxItems: 12,
    layout: "store_network_grid",
  },
  {
    sectionKey: "find_your_product",
    title: "Find Your Product",
    subtitle: "Curated departments for every stage — from bedroom studio to main stage.",
    accentLabel: "Shop by category",
    ctaText: "Browse all categories",
    ctaLink: "/category",
    isActive: true,
    sortOrder: 14,
    sourceMode: "manual",
    maxItems: 12,
    layout: "find_your_product",
  },
  {
    sectionKey: "social_rail",
    title: "Social Rail",
    subtitle:
      "Fixed left sidebar on storefront pages — social profile links and newsletter button.",
    ctaText: "Newsletter",
    ctaLink: "#newsletter",
    isActive: true,
    sortOrder: 15,
    sourceMode: "manual",
    maxItems: 10,
    layout: "social_rail",
  },
  {
    sectionKey: "trending_buys",
    title: "Buy what's trending",
    subtitle:
      "In-stock gear other musicians are shopping right now — products only, ready to add to cart.",
    accentLabel: "Trending now",
    ctaText: "Shop all trending",
    ctaLink: "/search/results?q=trending",
    secondaryCtaText: "View product",
    isActive: true,
    sortOrder: 16,
    sourceMode: "auto",
    maxItems: 3,
    layout: "product_grid",
  },
];
