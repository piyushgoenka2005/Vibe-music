import { getGoogleAuthCredentials } from "@/lib/auth/google-credentials";

export type GoogleOAuthHealthReason =
  "ok" | "misconfigured" | "deleted_client" | "invalid_client" | "redirect_mismatch" | "network";

export interface GoogleOAuthHealthResult {
  ok: boolean;
  reason: GoogleOAuthHealthReason;
  redirectUri: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { key: string; at: number; result: GoogleOAuthHealthResult } | null = null;

function oauthProbeCacheKey(): string {
  const creds = getGoogleAuthCredentials();
  return creds ? `${creds.clientId}:${resolveGoogleOAuthRedirectUri()}` : "missing";
}

/** Clears the in-process OAuth probe cache (e.g. after credential rotation). */
export function clearGoogleOAuthProbeCache(): void {
  cached = null;
}

/** Must match Auth.js Google provider callback for this deployment. */
export function resolveGoogleOAuthRedirectUri(): string {
  const base =
    process.env.AUTH_URL?.replace(/\/$/, "").trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim() ||
    (process.env.NODE_ENV === "production" ? "https://vibemusic.in" : "http://localhost:3000");
  return `${base}/api/auth/callback/google`;
}

/**
 * Probe Google's token endpoint with a fake authorization code.
 * `invalid_grant` means the client id + secret are valid; `deleted_client` means
 * the OAuth client was removed from Google Cloud Console.
 */
export async function probeGoogleOAuthClient(
  options: { bypassCache?: boolean; timeoutMs?: number } = {},
): Promise<GoogleOAuthHealthResult> {
  const redirectUri = resolveGoogleOAuthRedirectUri();
  const creds = getGoogleAuthCredentials();
  if (!creds) {
    return { ok: false, reason: "misconfigured", redirectUri };
  }

  const cacheKey = oauthProbeCacheKey();
  if (
    !options.bypassCache &&
    cached &&
    cached.key === cacheKey &&
    Date.now() - cached.at < CACHE_TTL_MS
  ) {
    return cached.result;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        grant_type: "authorization_code",
        code: "vibe-oauth-health-probe",
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? 12_000),
    });

    const payload = (await response.json()) as {
      error?: string;
      error_description?: string;
    };
    const error = payload.error ?? "";
    const description = (payload.error_description ?? "").toLowerCase();

    let result: GoogleOAuthHealthResult;
    if (error === "deleted_client" || description.includes("oauth client was deleted")) {
      result = { ok: false, reason: "deleted_client", redirectUri };
    } else if (error === "invalid_client") {
      result = { ok: false, reason: "invalid_client", redirectUri };
    } else if (error === "redirect_uri_mismatch") {
      result = { ok: false, reason: "redirect_mismatch", redirectUri };
    } else if (error === "invalid_grant" || error === "invalid_code") {
      result = { ok: true, reason: "ok", redirectUri };
    } else {
      result = { ok: false, reason: "misconfigured", redirectUri };
    }

    cached = { key: cacheKey, at: Date.now(), result };
    return result;
  } catch {
    const result: GoogleOAuthHealthResult = { ok: false, reason: "network", redirectUri };
    cached = { key: cacheKey, at: Date.now(), result };
    return result;
  }
}

export function formatGoogleOAuthHealthMessage(result: GoogleOAuthHealthResult): string {
  switch (result.reason) {
    case "deleted_client":
      return `Google OAuth client was deleted in Google Cloud Console. Create a new Web client in project vibemusic2026 and set AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET on the server. Redirect URI: ${result.redirectUri}`;
    case "invalid_client":
      return "Google OAuth client id/secret are invalid. Update AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET from Google Cloud Console → APIs & Services → Credentials.";
    case "redirect_mismatch":
      return `Google OAuth redirect URI mismatch. Add this Authorized redirect URI in Google Cloud Console: ${result.redirectUri}`;
    case "network":
      return "Could not reach Google OAuth servers to verify sign-in configuration.";
    case "misconfigured":
      return "Google OAuth credentials are missing or misconfigured.";
    default:
      return "Google OAuth is configured.";
  }
}
