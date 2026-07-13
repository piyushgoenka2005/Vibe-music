import "server-only";

const PLACEHOLDER_RE =
  /^(your[_-]?|changeme|xxx+|todo|replace|example|placeholder|<.*>)$/i;

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (!value) continue;
    if (PLACEHOLDER_RE.test(value)) continue;
    return value;
  }
  return undefined;
}

/** True only when Google OAuth credentials look usable (not blank/placeholder). */
export function isGoogleAuthConfigured(): boolean {
  const clientId = readEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID");
  const clientSecret = readEnv("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) return false;
  // Real Google client IDs are long and usually end with this suffix.
  if (clientId.length < 20 || clientSecret.length < 10) return false;
  return true;
}

export function getGoogleAuthCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  if (!isGoogleAuthConfigured()) return null;
  return {
    clientId: readEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID")!,
    clientSecret: readEnv("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET")!,
  };
}
