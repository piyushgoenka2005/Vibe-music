/** GA4 measurement ID (client + server). Example: G-XXXXXXXXXX */
export function getGaMeasurementId(): string | undefined {
  const id =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ||
    process.env.GA_MEASUREMENT_ID?.trim();
  if (!id) return undefined;
  if (!/^G-[A-Z0-9]+$/i.test(id)) return undefined;
  return id;
}

/** Optional Google Tag Manager container. Example: GTM-XXXXXXX */
export function getGtmId(): string | undefined {
  const id =
    process.env.NEXT_PUBLIC_GTM_ID?.trim() ||
    process.env.GTM_ID?.trim();
  if (!id) return undefined;
  if (!/^GTM-[A-Z0-9]+$/i.test(id)) return undefined;
  return id;
}

/** Measurement Protocol API secret (server-only purchase/refund events). */
export function getGaMeasurementApiSecret(): string | undefined {
  const secret = process.env.GA_MEASUREMENT_API_SECRET?.trim();
  return secret || undefined;
}

export function isClientAnalyticsConfigured(): boolean {
  return Boolean(getGaMeasurementId() || getGtmId());
}

export function isServerAnalyticsConfigured(): boolean {
  return Boolean(getGaMeasurementId() && getGaMeasurementApiSecret());
}

export function isAnalyticsEnabled(): boolean {
  return isClientAnalyticsConfigured();
}

export const ANALYTICS_CONSENT_KEY = "vibe-analytics-consent";
