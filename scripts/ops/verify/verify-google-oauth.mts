#!/usr/bin/env npx tsx
/**
 * Verify Google OAuth credentials against Google's token endpoint.
 * Usage: npx tsx --env-file=.env scripts/ops/verify/verify-google-oauth.mts
 */
import { isGoogleAuthConfigured } from "../../../src/lib/auth/google-credentials";
import {
  formatGoogleOAuthHealthMessage,
  probeGoogleOAuthClient,
  resolveGoogleOAuthRedirectUri,
} from "../../../src/lib/auth/google-oauth-health";

async function main() {
  if (!isGoogleAuthConfigured()) {
    console.error("Google OAuth is not configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.");
    process.exit(1);
  }

  const redirectUri = resolveGoogleOAuthRedirectUri();
  console.log(`Redirect URI (this environment): ${redirectUri}`);
  console.log("Required in Google Cloud Console (one Web client, all URIs):");
  console.log("  Origins: http://localhost:3000, https://vibemusic.in, https://www.vibemusic.in");
  console.log("  Redirects:");
  console.log("    http://localhost:3000/api/auth/callback/google");
  console.log("    https://vibemusic.in/api/auth/callback/google");
  console.log("    https://www.vibemusic.in/api/auth/callback/google");

  const result = await probeGoogleOAuthClient({ bypassCache: true });
  console.log(formatGoogleOAuthHealthMessage(result));

  if (!result.ok) {
    if (result.reason === "deleted_client") {
      console.error("\nNext steps:");
      console.error("1. Open https://console.cloud.google.com/apis/credentials?project=vibemusic2026");
      console.error("2. Create OAuth client ID → Web application");
      console.error("3. Add the origins + redirect URIs listed above");
      console.error("4. Run: npm run setup:google-oauth (local) or update AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET on the VPS");
      console.error("5. Verify: npm run verify:google-oauth — Production: redeploy with bash deploy/update.sh");
    }
    process.exit(1);
  }

  console.log("Google OAuth client is valid.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
