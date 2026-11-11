import { LOCALE } from "@/lib/locale";
import {
  formatPrice,
  formatPricePrecise,
  convertInrToCurrency,
  convertCurrencyToInr,
  getExchangeRate,
  getCurrencySymbol,
  EXCHANGE_RATES,
} from "@/lib/currency/rates";

export interface FormatCurrencyOptions extends Intl.NumberFormatOptions {
  currency?: string;
  locale?: string;
  convertFromInr?: boolean;
}

export function formatCurrency(value: number, options: FormatCurrencyOptions = {}): string {
  if (options.currency && options.currency !== "INR") {
    return formatPrice(value, options.currency, options.locale, options);
  }
  return new Intl.NumberFormat(options.locale || LOCALE.locale, {
    style: "currency",
    currency: options.currency || LOCALE.currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function formatCurrencyPrecise(value: number, options: FormatCurrencyOptions = {}): string {
  if (options.currency && options.currency !== "INR") {
    return formatPricePrecise(value, options.currency, options.locale);
  }
  return new Intl.NumberFormat(options.locale || LOCALE.locale, {
    style: "currency",
    currency: options.currency || LOCALE.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/** True when a catalog/unit price can be added to cart or checked out. */
export function isPurchasablePrice(price: number): boolean {
  return Number.isFinite(price) && price > 0;
}

/** Storefront price label — zero/invalid catalog prices show as Coming Soon. */
export function formatDisplayPrice(
  price: number,
  salePrice?: number | null,
  options?: FormatCurrencyOptions,
): string {
  const value = salePrice ?? price;
  if (!isPurchasablePrice(value)) {
    return options?.locale === "hi-IN" ? "जल्द आ रहा है" : "Coming Soon";
  }
  return formatCurrency(value, options);
}

/** Convert legacy USD catalog prices to INR (approx. ₹83.33 per $1). */
export function usdToInr(usd: number): number {
  return Math.round(usd * 83.33);
}

export {
  formatPrice,
  formatPricePrecise,
  convertInrToCurrency,
  convertCurrencyToInr,
  getExchangeRate,
  getCurrencySymbol,
  EXCHANGE_RATES,
};
