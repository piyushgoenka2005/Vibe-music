import fs from "node:fs";
import path from "node:path";

/**
 * Load env files for Playwright (and its webServer child).
 * Prefer `.env.local` over `.env` (Next.js convention). Existing process.env
 * wins only when PLAYWRIGHT_PRESERVE_ENV=true — otherwise local files refresh
 * DATABASE_URL / AUTH_* so a stale shell cannot poison E2E.
 */
export function loadLocalEnv(): void {
  const preserve = process.env.PLAYWRIGHT_PRESERVE_ENV === "true";
  const merged = new Map<string, string>();

  for (const file of [".env", ".env.local"]) {
    const full = path.join(process.cwd(), file);
    if (!fs.existsSync(full)) continue;

    for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      merged.set(key, value);
    }
  }

  for (const [key, value] of merged) {
    if (preserve && process.env[key]) continue;
    process.env[key] = value;
  }
}
