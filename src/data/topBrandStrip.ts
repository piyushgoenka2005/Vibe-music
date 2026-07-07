import { getBrandLogoUrl } from "@/lib/brandLogos";
import type { HomepageBrandItem } from "@/types/homepage";

export const TOP_BRAND_STRIP_SLUGS = [
  "hertz",
  "avus",
  "roland",
  "trinity",
  "adeon",
  "gibson",
  "fender",
  "ibanez",
  "prs",
  "epiphone",
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
  gibson: { id: "gibson", name: "GIBSON", slug: "gibson" },
  fender: { id: "fender", name: "FENDER", slug: "fender" },
  ibanez: { id: "ibanez", name: "IBANEZ", slug: "ibanez" },
  prs: { id: "prs", name: "PRS", slug: "prs" },
  epiphone: { id: "epiphone", name: "EPIPHONE", slug: "epiphone" },
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
