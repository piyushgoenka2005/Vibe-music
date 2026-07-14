import "server-only";

/**
 * Google Places / Maps key for checkout address autocomplete.
 * Accepts several common env names so a Maps key can be reused.
 */
export function getGooglePlacesApiKey(): string | undefined {
  const keys = [
    process.env.GOOGLE_PLACES_API_KEY,
    process.env.GOOGLE_MAPS_API_KEY,
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
  ];
  for (const raw of keys) {
    const value = raw?.trim();
    if (!value) continue;
    if (/^(your-|xxx|changeme|placeholder|todo)/i.test(value)) continue;
    return value;
  }
  return undefined;
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(getGooglePlacesApiKey());
}
