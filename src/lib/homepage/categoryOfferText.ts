/**
 * Pack subcategory + brands lines into HomepageSectionItem.offerText.
 * Line 1 = desc (subcategories), line 2 = brands.
 */
export function packCategoryOfferText(desc?: string, brands?: string): string | undefined {
  const d = desc?.trim() ?? "";
  const b = brands?.trim() ?? "";
  if (!d && !b) return undefined;
  if (!b) return d;
  if (!d) return `\n${b}`;
  return `${d}\n${b}`;
}

export function unpackCategoryOfferText(offerText?: string | null): {
  desc?: string;
  brands?: string;
} {
  if (!offerText?.trim()) return {};
  const [first = "", ...rest] = offerText.split("\n");
  const desc = first.trim() || undefined;
  const brands = rest.join("\n").trim() || undefined;
  return { desc, brands };
}
