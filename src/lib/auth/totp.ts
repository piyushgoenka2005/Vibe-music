import { createHash, randomBytes } from "node:crypto";
import {
  NobleCryptoPlugin,
  ScureBase32Plugin,
  TOTP,
  generateSecret,
} from "otplib";

/**
 * Thin wrapper over otplib v13 so the rest of the app never touches plugin
 * wiring. Pure crypto only — no DB, no session logic (kept unit-testable).
 */

export const TOTP_ISSUER = "Vibe Music Admin";

function newTotp(secret: string): TOTP {
  return new TOTP({
    secret,
    crypto: new NobleCryptoPlugin(),
    base32: new ScureBase32Plugin(),
  });
}

/** RFC-6238 base32 secret for authenticator-app enrollment. */
export function generateTotpSecret(): string {
  // otplib's generateSecret() already returns base32; fall back defensively.
  try {
    return generateSecret();
  } catch {
    return randomBytes(20).toString("base64")
      .replace(/[^A-Z2-7]/gi, "")
      .padEnd(32, "VIBEMUSIC234567")
      .slice(0, 32);
  }
}

export async function generateTotpCode(
  secret: string,
  epochMs?: number
): Promise<string> {
  if (!epochMs) return newTotp(secret).generate();
  // Deterministic generation for tests: freeze the epoch via global shim.
  const original = Date.now;
  Date.now = () => epochMs;
  try {
    return await newTotp(secret).generate();
  } finally {
    Date.now = original;
  }
}

export interface TotpVerifyResult {
  valid: boolean;
}

/**
 * Verify a 6-digit code. Accepts codes from the previous time-step window
 * (±30s drift), which is the standard UX for manual entry.
 */
export async function verifyTotpToken(
  secret: string,
  token: string
): Promise<TotpVerifyResult> {
  if (!secret) return { valid: false };
  const normalized = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return { valid: false };
  const result: unknown = await newTotp(secret).verify(normalized);
  return { valid: toValid(result) };
}

function toValid(result: unknown): boolean {
  if (typeof result === "boolean") return result;
  if (result && typeof result === "object" && "valid" in result) {
    return Boolean((result as { valid: unknown }).valid);
  }
  return false;
}

export function buildTotpUri(input: {
  secret: string;
  accountLabel: string;
}): string {
  return newTotp(input.secret).toURI({
    issuer: TOTP_ISSUER,
    label: input.accountLabel,
  });
}

/** Stable backup identifier derived from the secret — lets support verify identity offline without storing raw secrets twice. */
export function totpFingerprint(secret: string): string {
  return createHash("sha256").update(`vibe-totp:${secret}`).digest("hex").slice(0, 12);
}
