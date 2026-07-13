export const HOMEPAGE_SECTION_KEYS = [
  "new_arrivals",
  "best_sellers",
  "trending",
  "staff_picks",
  "featured_categories",
  "deals_of_the_day",
  "brand_strip",
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export type HomepageSourceMode = "manual" | "auto";

export type HomepageSectionLayout =
  | "product_grid"
  | "product_carousel"
  | "category_grid"
  | "deals_slider"
  | "brand_strip";

export interface HomepageSection {
  id: string;
  sectionKey: HomepageSectionKey;
  title: string;
  subtitle?: string;
  accentLabel?: string;
  ctaText?: string;
  ctaLink?: string;
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
  imageAlt: string;
  rating: number;
  reviewCount: number;
  href: string;
  badgeLabel?: string;
  offerText?: string;
  rank?: number;
}

export interface HomepageCategoryItem {
  id: string;
  slug: string;
  title: string;
  href: string;
  imageSrc: string;
  badge?: string;
}

export interface HomepageBrandItem {
  id: string;
  name: string;
  slug: string;
  href: string;
  logoUrl?: string;
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
  new_arrivals: "New Arrivals",
  best_sellers: "Best Sellers",
  trending: "Trending",
  staff_picks: "Staff Picks",
  featured_categories: "Featured Categories",
  deals_of_the_day: "Deals Of The Day",
  brand_strip: "Brand Strip",
};

export const DEFAULT_HOMEPAGE_SECTIONS: CreateHomepageSectionInput[] = [
  {
    sectionKey: "new_arrivals",
    title: "Top New Products",
    subtitle:
      "Fresh releases and just-landed gear from the brands you trust.",
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
    maxItems: 12,
    layout: "product_carousel",
  },
  {
    sectionKey: "trending",
    title: "Trending Now",
    ctaText: "Explore Trending",
    ctaLink: "/search/results?q=trending",
    isActive: true,
    sortOrder: 2,
    sourceMode: "auto",
    maxItems: 12,
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
    maxItems: 12,
    layout: "product_carousel",
  },
  {
    sectionKey: "featured_categories",
    title: "Popular Categories",
    ctaText: "Browse All Categories",
    ctaLink: "/search",
    isActive: true,
    sortOrder: 4,
    sourceMode: "auto",
    maxItems: 12,
    layout: "category_grid",
  },
  {
    sectionKey: "deals_of_the_day",
    title: "Deals Of The Day",
    accentLabel: "Limited Time",
    ctaText: "Shop All Deals",
    ctaLink: "/deals",
    isActive: true,
    sortOrder: 5,
    sourceMode: "auto",
    maxItems: 8,
    layout: "deals_slider",
  },
  {
    sectionKey: "brand_strip",
    title: "Shop Top Brands",
    isActive: true,
    sortOrder: 6,
    sourceMode: "auto",
    maxItems: 16,
    layout: "brand_strip",
  },
];
