/**
 * Reserve high-priority image preloads strictly for the above-the-fold hero banner
 * so below-the-fold carousel/grid cards never stall initial page load or LCP.
 */
export function shouldPrioritizeHomepageProductImage(
  _sectionKey: string,
  _index: number,
  _options?: { decorative?: boolean },
): boolean {
  return false;
}

export function shouldPrioritizeNewArrivalImage(
  _index: number,
  _options?: { decorative?: boolean },
): boolean {
  return false;
}
