#!/usr/bin/env npx tsx
import { isGoogleAuthConfigured, getGoogleAuthCredentials } from "@/lib/auth/google-credentials";
import { probeGoogleOAuthClient } from "@/lib/auth/google-oauth-health";

const id = process.env.AUTH_GOOGLE_ID?.trim() ?? "";
const creds = getGoogleAuthCredentials();

console.log(
  JSON.stringify(
    {
      nodeEnv: process.env.NODE_ENV,
      configured: isGoogleAuthConfigured(),
      hasCreds: Boolean(creds),
      idLength: id.length,
      idHasGoogleDomain: id.includes(".apps.googleusercontent.com"),
      probe: await probeGoogleOAuthClient({ bypassCache: true }),
    },
    null,
    2,
  ),
);
