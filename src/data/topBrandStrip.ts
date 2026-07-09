import { getBrandLogoUrl } from "@/lib/brandLogos";
import type { HomepageBrandItem } from "@/types/homepage";

export const TOP_BRAND_STRIP_SLUGS = [
  "roland",
  "hertz",
  "avus",
  "zoom",
  "gibraltar",
  "adeon",
  "zildjian",
  "hartke",
  "m-audio",
] as const;

export type TopBrandStripSlug = (typeof TOP_BRAND_STRIP_SLUGS)[number];

interface BrandLike {
  id: string;
  name: string;
  slug: string;
}

export const ROLAND_BRAND_FALLBACK = {
  id: "roland",
  name: "ROLAND",
  slug: "roland",
} as const;

const BRAND_STRIP_FALLBACKS: Record<string, BrandLike> = {
  roland: ROLAND_BRAND_FALLBACK,
  hertz: { id: "hertz", name: "HERTZ", slug: "hertz" },
  avus: { id: "avus", name: "AVUS", slug: "avus" },
  zoom: { id: "zoom", name: "ZOOM", slug: "zoom" },
  gibraltar: { id: "gibraltar", name: "GIBRALTAR", slug: "gibraltar" },
  adeon: { id: "adeon", name: "ADEON", slug: "adeon" },
  zildjian: { id: "zildjian", name: "ZILDJIAN", slug: "zildjian" },
  hartke: { id: "hartke", name: "HARTKE", slug: "hartke" },
  "m-audio": { id: "m-audio", name: "M-AUDIO", slug: "m-audio" },
};

export function buildTopBrandStripItems(brands: BrandLike[]): HomepageBrandItem[] {
  const brandBySlug = new Map(brands.map((brand) => [brand.slug, brand]));

  return TOP_BRAND_STRIP_SLUGS.flatMap((slug) => {
    const brand = brandBySlug.get(slug) ?? BRAND_STRIP_FALLBACKS[slug] ?? null;
    if (!brand) return [];

    const logoUrl = getBrandLogoUrl(brand.slug);

    return [
      {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        href: `/search?brand=${encodeURIComponent(brand.slug)}`,
        ...(logoUrl ? { logoUrl } : {}),
      },
    ];
  });
}
