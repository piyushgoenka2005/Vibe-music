import { ACTIVE_CURRENCIES, type CurrencyItem } from "@/components/layout/currencyLocaleStore";
import { LOCALE } from "@/lib/locale";

/** Active exchange rates relative to base INR (1 INR = X target currency). */
export const EXCHANGE_RATES: Record<string, number> = {
  INR: 1.0,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
};

/** Preferred locale per currency for Intl formatting. */
export const CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
};

/** Fallback currency symbols. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED",
};

export function getExchangeRate(currencyCode: string): number {
  const normalized = (currencyCode || "INR").toUpperCase();
  return EXCHANGE_RATES[normalized] ?? 1.0;
}

export function getCurrencySymbol(currencyCode: string): string {
  const normalized = (currencyCode || "INR").toUpperCase();
  const found = ACTIVE_CURRENCIES.find((c) => c.code === normalized);
  return found?.symbol ?? CURRENCY_SYMBOLS[normalized] ?? normalized;
}

export function getCurrencyInfo(currencyCode: string): CurrencyItem {
  const normalized = (currencyCode || "INR").toUpperCase();
  return ACTIVE_CURRENCIES.find((c) => c.code === normalized) ?? ACTIVE_CURRENCIES[0];
}

/** Converts an INR amount to target currency. */
export function convertInrToCurrency(amountInInr: number, targetCurrency: string): number {
  if (!Number.isFinite(amountInInr) || amountInInr <= 0) return 0;
  const rate = getExchangeRate(targetCurrency);
  return amountInInr * rate;
}

/** Converts an amount in foreign currency back to INR. */
export function convertCurrencyToInr(amountInTarget: number, sourceCurrency: string): number {
  if (!Number.isFinite(amountInTarget) || amountInTarget <= 0) return 0;
  const rate = getExchangeRate(sourceCurrency);
  return rate > 0 ? Math.round(amountInTarget / rate) : amountInTarget;
}

/** Formats a price (given in INR) converted to the specified currency. */
export function formatPrice(
  amountInInr: number,
  currencyCode = "INR",
  localeCode?: string,
  options: Intl.NumberFormatOptions = {},
): string {
  const currency = (currencyCode || "INR").toUpperCase();
  const converted = convertInrToCurrency(amountInInr, currency);
  const locale =
    localeCode || (currency === "INR" ? LOCALE.locale : CURRENCY_LOCALES[currency] || "en-US");

  // For INR default to 0 decimals for whole amounts; for non-INR default to 0 decimals when requested or 2
  const maxDigits = options.maximumFractionDigits ?? (currency === "INR" ? 0 : 2);
  const minDigits =
    options.minimumFractionDigits ?? (currency === "INR" ? 0 : converted % 1 === 0 ? 0 : 2);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
    ...options,
  }).format(converted);
}

/** Formats a price precisely with 2 decimal places (or 0 for whole INR). */
export function formatPricePrecise(
  amountInInr: number,
  currencyCode = "INR",
  localeCode?: string,
): string {
  const currency = (currencyCode || "INR").toUpperCase();
  const converted = convertInrToCurrency(amountInInr, currency);
  const locale =
    localeCode || (currency === "INR" ? LOCALE.locale : CURRENCY_LOCALES[currency] || "en-US");

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "INR" ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(converted);
}

/** Display price helper: handles sale price & "Coming Soon" for invalid prices. */
export function formatDisplayPriceWithCurrency(
  price: number,
  salePrice?: number | null,
  currencyCode = "INR",
  localeCode?: string,
): string {
  const value = salePrice ?? price;
  if (!Number.isFinite(value) || value <= 0) {
    return localeCode === "hi-IN" ? "जल्द आ रहा है" : "Coming Soon";
  }
  return formatPrice(value, currencyCode, localeCode);
}
