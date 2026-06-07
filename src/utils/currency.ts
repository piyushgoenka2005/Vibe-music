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

/** Convert legacy USD catalog prices to INR (approx. ₹83.33 per $1). */
export function usdToInr(usd: number): number {
  return Math.round(usd * 83.33);
}
