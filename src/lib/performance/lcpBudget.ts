/**
 * Cap concurrent high-priority image fetches on the homepage so LCP
 * (banner + hero mosaic) is not starved by carousel/grid cards.
 */
const VISIBLE_CAROUSEL_CARD_COUNT = 12;

export function shouldPrioritizeHomepageProductImage(
  sectionKey: string,
  index: number,
  options?: { decorative?: boolean },
): boolean {
  if (options?.decorative) return false;

  if (sectionKey !== "trending" && sectionKey !== "best_sellers" && sectionKey !== "staff_picks") {
    return false;
  }

  // Eager-load the first visible row so horizontal carousels do not stall on lazy images.
  return index < VISIBLE_CAROUSEL_CARD_COUNT;
}

export function shouldPrioritizeNewArrivalImage(
  index: number,
  options?: { decorative?: boolean },
): boolean {
  if (options?.decorative) return false;
  // One eager card in the new-arrivals marquee (first visible sequence only).
  return index === 0;
}
