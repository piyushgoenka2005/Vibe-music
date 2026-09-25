import type { HomepageSectionLayout } from "@/types/homepage";

/** Product carousels/grids/deals — cap image payload on homepage (L-11). */
export const HOMEPAGE_PRODUCT_SECTION_MAX_ITEMS = 8;

/** Brand logo strip — lighter assets, still bounded. */
export const HOMEPAGE_BRAND_STRIP_MAX_ITEMS = 12;

/** Category tiles — static curated images. */
export const HOMEPAGE_CATEGORY_SECTION_MAX_ITEMS = 12;

export function clampHomepageMaxItems(
  layout: HomepageSectionLayout | string,
  maxItems: number,
): number {
  const safe = Math.max(1, maxItems);
  switch (layout) {
    case "product_carousel":
    case "deals_slider":
    case "product_grid":
      return Math.min(safe, HOMEPAGE_PRODUCT_SECTION_MAX_ITEMS);
    case "brand_strip":
      return Math.min(safe, HOMEPAGE_BRAND_STRIP_MAX_ITEMS);
    case "category_grid":
    case "browse_category_cards":
    case "category_bento":
      return Math.min(safe, HOMEPAGE_CATEGORY_SECTION_MAX_ITEMS);
    default:
      return safe;
  }
}
