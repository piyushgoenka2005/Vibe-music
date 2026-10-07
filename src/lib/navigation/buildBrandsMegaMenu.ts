import brandsCatalog from "@/data/catalog/brands.json";
import type { MegaMenuItem } from "@/data/headerMegaMenu";
import { TOP_BRAND_STRIP_SLUGS } from "@/data/topBrandStrip";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { brandIndexLetter } from "@/lib/brands/groupCatalogByBrand";
import { brandPath, ROUTES } from "@/lib/routes";
import type { BrandWithCount } from "@/types/brandDirectory";

export const BRANDS_MEGA_MENU_SLUG = "brands";

const LETTER_RANGES = [
  { heading: "A – D", from: "A", to: "D" },
  { heading: "E – L", from: "E", to: "L" },
  { heading: "M – Z", from: "M", to: "Z" },
] as const;

function letterInRange(letter: string, from: string, to: string): boolean {
  if (letter === "#") return to === "Z";
  return letter >= from && letter <= to;
}

function buildFeatured(brands: BrandWithCount[]): MegaMenuItem["featured"] {
  const bySlug = new Map(brands.map((brand) => [brand.slug, brand]));

  const featured = TOP_BRAND_STRIP_SLUGS.flatMap((slug) => {
    const brand = bySlug.get(slug);
    const image = getBrandLogoUrl(slug);
    if (!brand || !image) return [];
    return [
      {
        title: brand.name,
        href: brandPath(brand.slug),
        image,
        imageClassName: "header-mega__card-image--horizontal",
      },
    ];
  });

  if (featured.length >= 2) return featured.slice(0, 2);

  return brands
    .filter((brand) => getBrandLogoUrl(brand.slug))
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name))
    .slice(0, 2)
    .map((brand) => ({
      title: brand.name,
      href: brandPath(brand.slug),
      image: getBrandLogoUrl(brand.slug)!,
      imageClassName: "header-mega__card-image--horizontal",
    }));
}

/** Catalog fallback when live brand counts are unavailable (mobile nav chevron, etc.). */
export function buildBrandsMegaMenuFromCatalog(): MegaMenuItem | null {
  return buildBrandsMegaMenu(brandsCatalog.map((brand) => ({ ...brand, productCount: 0 })));
}

/** Prefer live menu from the server; fall back to static catalog brands. */
export function resolveBrandsMegaMenu(menu: MegaMenuItem | null | undefined): MegaMenuItem | null {
  return menu ?? buildBrandsMegaMenuFromCatalog();
}

/** Build the header mega menu for Brands from live catalog data. */
export function buildBrandsMegaMenu(brands: BrandWithCount[]): MegaMenuItem | null {
  if (brands.length === 0) return null;

  const sorted = [...brands].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  const columns = LETTER_RANGES.map((range) => ({
    heading: range.heading,
    links: sorted
      .filter((brand) => letterInRange(brandIndexLetter(brand.name), range.from, range.to))
      .map((brand) => ({
        label: brand.name,
        href: brandPath(brand.slug),
      })),
  }));

  const lastColumn = columns[columns.length - 1];
  if (lastColumn) {
    lastColumn.links.push({ label: "Shop all brands", href: ROUTES.brands });
  }

  const nonEmptyColumns = columns.filter((column) => column.links.length > 0);
  if (nonEmptyColumns.length === 0) return null;

  return {
    slug: BRANDS_MEGA_MENU_SLUG,
    name: "Brands",
    href: ROUTES.brands,
    columns: nonEmptyColumns,
    featured: buildFeatured(sorted),
  };
}
