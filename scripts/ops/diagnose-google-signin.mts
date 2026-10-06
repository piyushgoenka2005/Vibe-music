#!/usr/bin/env npx tsx
import { isGoogleAuthConfigured } from "../../src/lib/auth/google-credentials";
import { probeGoogleOAuthClient } from "../../src/lib/auth/google-oauth-health";
import { verifyPostgresConnection } from "../../src/lib/server/postgresHealth";

const configured = isGoogleAuthConfigured();
const db = await verifyPostgresConnection();
const oauthFast = await probeGoogleOAuthClient({ bypassCache: true, timeoutMs: 1_500 });
const oauthSlow = await probeGoogleOAuthClient({ bypassCache: true, timeoutMs: 8_000 });

console.log(
  JSON.stringify(
    {
      configured,
      database: db,
      oauth1500ms: oauthFast,
      oauth8000ms: oauthSlow,
      authGoogleIdPrefix: process.env.AUTH_GOOGLE_ID?.slice(0, 20) ?? null,
    },
    null,
    2,
  ),
);
