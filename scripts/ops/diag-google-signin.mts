#!/usr/bin/env npx tsx
import { isGoogleAuthConfigured } from "@/lib/auth/google-credentials";
import { probeGoogleOAuthClient } from "@/lib/auth/google-oauth-health";
import { getGoogleSignInStatus } from "@/lib/auth/google-config";

async function main() {
  const id = process.env.AUTH_GOOGLE_ID?.trim() ?? "";
  console.log(
    JSON.stringify(
      {
        nodeEnv: process.env.NODE_ENV,
        configured: isGoogleAuthConfigured(),
        idLength: id.length,
        idHasGoogleDomain: id.includes(".apps.googleusercontent.com"),
        probe: await probeGoogleOAuthClient({ bypassCache: true }),
        status: await getGoogleSignInStatus(),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
