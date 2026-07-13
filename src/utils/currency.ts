import { LOCALE } from "@/lib/locale";

export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(LOCALE.locale, {
    style: "currency",
    currency: LOCALE.currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function formatCurrencyPrecise(value: number): string {
  return new Intl.NumberFormat(LOCALE.locale, {
    style: "currency",
    currency: LOCALE.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Storefront price label — zero/invalid catalog prices show as Coming Soon. */
export function formatDisplayPrice(
  price: number,
  salePrice?: number | null
): string {
  const value = salePrice ?? price;
  if (!Number.isFinite(value) || value <= 0) {
    return "Coming Soon";
  }
  return formatCurrency(value);
}

/** Convert legacy USD catalog prices to INR (approx. ₹83.33 per $1). */
export function usdToInr(usd: number): number {
  return Math.round(usd * 83.33);
}
