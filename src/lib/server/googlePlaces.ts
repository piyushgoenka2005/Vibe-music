import "server-only";

import { logInfo, logWarn } from "@/lib/server/logger";

/**
 * Google Places / Maps key for checkout address autocomplete.
 * Canonical: `GOOGLE_PLACES_API_KEY`
 * Accepted aliases (same server helper): Maps / NEXT_PUBLIC_* names so a
 * single Maps key can be reused without changing checkout.
 */
export const GOOGLE_PLACES_ENV_KEYS = [
  "GOOGLE_PLACES_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_PLACES_API_KEY",
] as const;

export type GooglePlacesEnvKey = (typeof GOOGLE_PLACES_ENV_KEYS)[number];

export type GooglePlacesInvalidReason =
  | "placeholder"
  | "too_short"
  | "whitespace_only";

export type GooglePlacesConfigInspection =
  | { status: "configured"; source: GooglePlacesEnvKey; keyLength: number }
  | { status: "missing" }
  | {
      status: "invalid";
      reason: GooglePlacesInvalidReason;
      source: GooglePlacesEnvKey;
    };

/** Typical Google API keys are ~39 chars; reject obvious stubs. */
const MIN_USABLE_KEY_LENGTH = 20;

const PLACEHOLDER_KEY =
  /^(your-|xxx+|changeme|placeholder|todo|replace|example|dummy|test[_-]?key)/i;

let loggedMissingConfig = false;
let loggedInvalidConfig = false;
let loggedConfigured = false;
const loggedApiFailures = new Set<string>();

function classifyRawKey(
  raw: string | undefined
):
  | { kind: "empty" }
  | { kind: "usable"; value: string }
  | { kind: "invalid"; reason: GooglePlacesInvalidReason } {
  if (raw == null) return { kind: "empty" };
  if (raw.length > 0 && raw.trim().length === 0) {
    return { kind: "invalid", reason: "whitespace_only" };
  }
  const value = raw.trim();
  if (!value) return { kind: "empty" };
  if (PLACEHOLDER_KEY.test(value)) {
    return { kind: "invalid", reason: "placeholder" };
  }
  if (value.length < MIN_USABLE_KEY_LENGTH) {
    return { kind: "invalid", reason: "too_short" };
  }
  return { kind: "usable", value };
}

/** Inspect env without throwing — never returns the secret value. */
export function inspectGooglePlacesConfig(): GooglePlacesConfigInspection {
  for (const source of GOOGLE_PLACES_ENV_KEYS) {
    const classified = classifyRawKey(process.env[source]);
    if (classified.kind === "usable") {
      return {
        status: "configured",
        source,
        keyLength: classified.value.length,
      };
    }
  }

  for (const source of GOOGLE_PLACES_ENV_KEYS) {
    const classified = classifyRawKey(process.env[source]);
    if (classified.kind === "invalid") {
      return {
        status: "invalid",
        reason: classified.reason,
        source,
      };
    }
  }

  return { status: "missing" };
}

export function getGooglePlacesApiKey(): string | undefined {
  for (const source of GOOGLE_PLACES_ENV_KEYS) {
    const classified = classifyRawKey(process.env[source]);
    if (classified.kind === "usable") return classified.value;
  }
  return undefined;
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(getGooglePlacesApiKey());
}

/**
 * One-shot startup / first-use warning when Places cannot run.
 * Safe to call from instrumentation and from API routes.
 */
export function warnIfGooglePlacesMisconfigured(context = "googlePlaces"): void {
  const inspection = inspectGooglePlacesConfig();

  if (inspection.status === "configured") {
    if (loggedConfigured) return;
    loggedConfigured = true;
    logInfo(
      "Google Places is configured; checkout address autocomplete can initialize",
      context,
      {
        status: inspection.status,
        source: inspection.source,
        keyLength: inspection.keyLength,
        preferredEnvKey: "GOOGLE_PLACES_API_KEY",
      }
    );
    return;
  }

  if (inspection.status === "invalid") {
    if (loggedInvalidConfig) return;
    loggedInvalidConfig = true;
    logWarn(
      `Google Places key in ${inspection.source} is invalid (${inspection.reason}); address autocomplete stays off until a real key is set`,
      context,
      {
        status: inspection.status,
        reason: inspection.reason,
        source: inspection.source,
        acceptedEnvKeys: [...GOOGLE_PLACES_ENV_KEYS],
        preferredEnvKey: "GOOGLE_PLACES_API_KEY",
        minKeyLength: MIN_USABLE_KEY_LENGTH,
      }
    );
    return;
  }

  if (loggedMissingConfig) return;
  loggedMissingConfig = true;
  logWarn(
    "Google Places is not configured; checkout address autocomplete falls back to manual entry",
    context,
    {
      status: "missing",
      acceptedEnvKeys: [...GOOGLE_PLACES_ENV_KEYS],
      preferredEnvKey: "GOOGLE_PLACES_API_KEY",
    }
  );
}

/** Log Google Places API failures without leaking the key (once per distinct issue). */
export function warnGooglePlacesApiFailure(
  message: string,
  meta?: Record<string, unknown>,
  context = "googlePlaces"
): void {
  const fingerprint = `${message}:${String(meta?.placesStatus ?? meta?.httpStatus ?? meta?.error ?? "")}`;
  if (loggedApiFailures.has(fingerprint)) {
    return;
  }
  loggedApiFailures.add(fingerprint);
  logWarn(message, context, meta);
}

/** Reset one-shot log flags (tests only). */
export function resetGooglePlacesLogStateForTests(): void {
  loggedMissingConfig = false;
  loggedInvalidConfig = false;
  loggedConfigured = false;
  loggedApiFailures.clear();
}
