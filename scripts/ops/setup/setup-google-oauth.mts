#!/usr/bin/env npx tsx
/**
 * Update .env.local with new Google OAuth credentials and verify them.
 *
 * Usage:
 *   npm run setup:google-oauth
 *   npm run setup:google-oauth -- --id=YOUR_CLIENT_ID --secret=YOUR_CLIENT_SECRET
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : undefined;
}

function upsertEnvLine(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }
  return `${content.trimEnd()}\n${line}\n`;
}

async function promptFor(label: string, preset?: string): Promise<string> {
  if (preset) return preset;
  const rl = readline.createInterface({ input, output });
  const value = (await rl.question(`${label}: `)).trim();
  rl.close();
  return value;
}

async function main() {
  console.log("Google OAuth setup for Vibe Music\n");
  console.log("Create a Web client at:");
  console.log("https://console.cloud.google.com/auth/clients/create?project=vibemusic2026\n");
  console.log("Authorized JavaScript origins:");
  console.log("  http://localhost:3000");
  console.log("  https://vibemusic.in");
  console.log("  https://www.vibemusic.in");
  console.log("\nAuthorized redirect URIs:");
  console.log("  http://localhost:3000/api/auth/callback/google");
  console.log("  https://vibemusic.in/api/auth/callback/google");
  console.log("  https://www.vibemusic.in/api/auth/callback/google\n");

  const clientId = await promptFor("AUTH_GOOGLE_ID", readArg("id"));
  const clientSecret = await promptFor("AUTH_GOOGLE_SECRET", readArg("secret"));

  if (!clientId || !clientSecret) {
    console.error("Both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are required.");
    process.exit(1);
  }

  if (!clientId.includes(".apps.googleusercontent.com")) {
    console.error(
      "AUTH_GOOGLE_ID must be a Google client id ending in .apps.googleusercontent.com (not AUTH_SECRET).",
    );
    process.exit(1);
  }
  if (clientId.startsWith("GOCSPX-") || clientSecret.includes(".apps.googleusercontent.com")) {
    console.error("Swap them — client id and client secret look reversed.");
    process.exit(1);
  }

  if (!fs.existsSync(envPath)) {
    console.error(`.env.local not found at ${envPath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(envPath, "utf8");
  content = upsertEnvLine(content, "AUTH_GOOGLE_ID", clientId);
  content = upsertEnvLine(content, "AUTH_GOOGLE_SECRET", clientSecret);
  if (!/^AUTH_URL=/m.test(content)) {
    content = upsertEnvLine(content, "AUTH_URL", "http://localhost:3000");
  }
  fs.writeFileSync(envPath, content, "utf8");
  console.log("\nUpdated .env.local");

  process.env.AUTH_GOOGLE_ID = clientId;
  process.env.AUTH_GOOGLE_SECRET = clientSecret;
  process.env.AUTH_URL = process.env.AUTH_URL ?? "http://localhost:3000";

  const {
    clearGoogleOAuthProbeCache,
    probeGoogleOAuthClient,
    resolveGoogleOAuthRedirectUri,
    formatGoogleOAuthHealthMessage,
  } = await import("../../src/lib/auth/google-oauth-health");
  clearGoogleOAuthProbeCache();
  const result = await probeGoogleOAuthClient({ bypassCache: true });
  console.log(`\nRedirect URI: ${resolveGoogleOAuthRedirectUri()}`);
  console.log(formatGoogleOAuthHealthMessage(result));

  if (!result.ok) {
    process.exit(1);
  }

  console.log("\nSuccess. Restart the dev server (npm run dev) and try Google sign-in on /login.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
