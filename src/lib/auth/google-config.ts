import "server-only";

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

  const [{ verifyPostgresConnection }, { getCachedGoogleOAuthProbeResult }] = await Promise.all([
    import("@/lib/server/postgresHealth"),
    import("@/lib/auth/google-oauth-health"),
  ]);

  const database = await verifyPostgresConnection();
  if (!database.ok) {
    return { available: false, reason: "database" };
  }

  // Check if a background startup probe definitively detected a deleted or invalid client.
  // We NEVER block live customer login/register requests with outbound network calls to Google.
  const cached = getCachedGoogleOAuthProbeResult();
  if (
    cached &&
    !cached.ok &&
    (cached.reason === "deleted_client" ||
      cached.reason === "invalid_client" ||
      cached.reason === "redirect_mismatch")
  ) {
    return { available: false, reason: mapOAuthHealthReason(cached.reason) };
  }

  return { available: true };
}

/** Google OAuth persists accounts in Postgres and needs a live Google client. */
export async function getGoogleSignInStatus(): Promise<GoogleSignInStatus> {
  // Always resolve live — probeGoogleOAuthClient keeps a short in-process cache.
  // unstable_cache previously pinned "unavailable" when env loaded after module init.
  return resolveGoogleSignInStatus();
}

export async function isGoogleSignInAvailable(): Promise<boolean> {
  const status = await getGoogleSignInStatus();
  return status.available;
}
