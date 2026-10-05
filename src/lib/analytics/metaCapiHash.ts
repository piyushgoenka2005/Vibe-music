import { createHash } from "node:crypto";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Meta CAPI — normalize email: trim, lowercase. */
export function hashMetaEmail(email: string): string {
  return sha256Hex(email.trim().toLowerCase());
}

/** Meta CAPI — digits only with country code (India: 91 + 10-digit mobile). */
export function hashMetaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return sha256Hex(normalized);
}
