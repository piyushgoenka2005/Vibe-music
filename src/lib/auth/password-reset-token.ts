import { createHash, randomBytes } from "node:crypto";

/** SHA-256 hex digest for password-reset tokens (never store the raw token). */
export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Cryptographically random reset token (returned once to the user via email). */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("hex");
}
