/** Resolves a short deals-rail ribbon label from curated data or discount math. */
export function resolveDealBadgeLabel(item: {
  badgeLabel?: string | null;
  price: number;
  salePrice?: number | null;
}): string {
  const curated = item.badgeLabel?.trim();
  if (curated) {
    const pctMatch = curated.match(/(\d+)\s*%/i);
    if (pctMatch) return `${pctMatch[1]}% Off`;
    if (/hot/i.test(curated)) return "Hot Deal";
    if (/today|deal/i.test(curated)) return "Deal";
    return curated.length > 12 ? curated.slice(0, 12) : curated;
  }

  const sale = item.salePrice;
  if (
    sale != null &&
    Number.isFinite(sale) &&
    sale > 0 &&
    Number.isFinite(item.price) &&
    item.price > sale
  ) {
    const pct = Math.round(((item.price - sale) / item.price) * 100);
    if (pct >= 1) return `${pct}% Off`;
  }

  return "";
}
