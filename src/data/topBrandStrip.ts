import { getBrandLogoUrl } from "@/lib/brandLogos";
import { brandPath } from "@/lib/routes";
import type { HomepageBrandItem } from "@/types/homepage";

export const TOP_BRAND_STRIP_SLUGS = [
  "roland",
  "hertz",
  "gibraltar",
  "adeon",
  "avus",
  "boss",
  "zoom",
  "nord",
] as const;

export type TopBrandStripSlug = (typeof TOP_BRAND_STRIP_SLUGS)[number];

interface BrandLike {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export const ROLAND_BRAND_FALLBACK = {
  id: "roland",
  name: "ROLAND",
  slug: "roland",
} as const;

const BRAND_STRIP_FALLBACKS: Record<string, BrandLike> = {
  roland: ROLAND_BRAND_FALLBACK,
  hertz: { id: "hertz", name: "HERTZ", slug: "hertz" },
  gibraltar: { id: "gibraltar", name: "GIBRALTAR", slug: "gibraltar" },
  adeon: { id: "adeon", name: "ADEON", slug: "adeon" },
  avus: { id: "avus", name: "AVUS", slug: "avus" },
  boss: { id: "boss", name: "BOSS", slug: "boss" },
  zoom: { id: "zoom", name: "ZOOM", slug: "zoom" },
  nord: { id: "nord", name: "Nord", slug: "nord" },
};

export function buildTopBrandStripItems(
  brands: BrandLike[],
  productCounts?: ReadonlyMap<string, number>,
): HomepageBrandItem[] {
  const brandBySlug = new Map(brands.map((brand) => [brand.slug, brand]));

  return TOP_BRAND_STRIP_SLUGS.flatMap((slug) => {
    const brand = brandBySlug.get(slug) ?? BRAND_STRIP_FALLBACKS[slug] ?? null;
    if (!brand) return [];

    // Skip brands that are confirmed to have zero products to avoid empty category pages.
    if (productCounts !== undefined && (productCounts.get(slug) ?? 0) === 0) return [];

    const logoUrl = brand.logoUrl ?? getBrandLogoUrl(brand.slug);

    return [
      {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        href: brandPath(brand.slug),
        ...(logoUrl ? { logoUrl } : {}),
      },
    ];
  });
}
