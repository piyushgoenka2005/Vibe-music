import { formatCurrencyPrecise, usdToInr } from "@/utils/currency";

export function formatLegacyUsdPrice(usd: number): string {
  return formatCurrencyPrecise(usdToInr(usd));
}

/** Convert `$123.45` fragments inside promo copy to INR (matches HtmlSection normalization). */
export function formatLegacyUsdInText(text: string): string {
  return text.replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, (_, amount: string) => {
    const usd = parseFloat(amount.replace(/,/g, ""));
    return formatCurrencyPrecise(usdToInr(usd));
  });
}
