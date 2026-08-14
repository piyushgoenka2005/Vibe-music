/**
 * Cap concurrent high-priority image fetches on the homepage so LCP
 * (banner + hero mosaic) is not starved by carousel/grid cards.
 */
export function shouldPrioritizeHomepageProductImage(
  sectionKey: string,
  index: number,
  options?: { decorative?: boolean }
): boolean {
  if (options?.decorative || index !== 0) return false;

  // Only the first card of the first product carousel below the hero.
  return sectionKey === "trending";
}

export function shouldPrioritizeNewArrivalImage(
  index: number,
  options?: { decorative?: boolean }
): boolean {
  if (options?.decorative) return false;
  // One eager card in the new-arrivals marquee (first visible sequence only).
  return index === 0;
}
