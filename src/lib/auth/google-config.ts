import "server-only";

import { unstable_cache } from "next/cache";
import { getGoogleAuthCredentials, isGoogleAuthConfigured } from "@/lib/auth/google-credentials";

export { getGoogleAuthCredentials, isGoogleAuthConfigured };

export type GoogleAuthUnavailableReason = "oauth" | "oauth_deleted" | "oauth_invalid" | "database";

export interface GoogleSignInStatus {
  available: boolean;
  reason?: GoogleAuthUnavailableReason;
}

function mapOAuthHealthReason(
  reason: import("@/lib/auth/google-oauth-health").GoogleOAuthHealthReason,
): GoogleAuthUnavailableReason {
  if (reason === "deleted_client") return "oauth_deleted";
  if (reason === "invalid_client" || reason === "redirect_mismatch") return "oauth_invalid";
  return "oauth";
}

async function resolveGoogleSignInStatus(): Promise<GoogleSignInStatus> {
  if (!isGoogleAuthConfigured()) {
    return { available: false, reason: "oauth" };
  }

  const [{ verifyPostgresConnection }, { probeGoogleOAuthClient }] = await Promise.all([
    import("@/lib/server/postgresHealth"),
    import("@/lib/auth/google-oauth-health"),
  ]);

  const [database, oauth] = await Promise.all([
    verifyPostgresConnection(),
    // Reuse the module cache populated by instrumentation when possible.
    probeGoogleOAuthClient({ timeoutMs: 8_000 }),
  ]);

  if (!database.ok) {
    return { available: false, reason: "database" };
  }

  if (!oauth.ok) {
    return { available: false, reason: mapOAuthHealthReason(oauth.reason) };
  }

  return { available: true };
}

const googleSignInStatusCacheKey = [
  "google-sign-in-status-v4",
  process.env.AUTH_GOOGLE_ID?.trim() ?? "",
  process.env.AUTH_URL?.trim() ?? process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "",
];

const getCachedGoogleSignInStatus = unstable_cache(
  resolveGoogleSignInStatus,
  googleSignInStatusCacheKey,
  { revalidate: process.env.NODE_ENV === "production" ? 300 : 30 },
);

/** Google OAuth persists accounts in Postgres and needs a live Google client. */
export async function getGoogleSignInStatus(): Promise<GoogleSignInStatus> {
  // Dev: always probe live so credential rotations show up without waiting on cache.
  if (process.env.NODE_ENV !== "production") {
    return resolveGoogleSignInStatus();
  }
  return getCachedGoogleSignInStatus();
}

export async function isGoogleSignInAvailable(): Promise<boolean> {
  const status = await getGoogleSignInStatus();
  return status.available;
}
