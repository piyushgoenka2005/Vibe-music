import { createHash, randomInt } from "node:crypto";
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "10minutemail.com",
  "yopmail.com",
]);

export function hashClientFingerprint(ip?: string | null, userAgent?: string | null): {
  ipHash?: string;
  userAgentHash?: string;
} {
  const ipHash = ip?.trim()
    ? createHash("sha256").update(ip.trim()).digest("hex").slice(0, 32)
    : undefined;
  const userAgentHash = userAgent?.trim()
    ? createHash("sha256").update(userAgent.trim()).digest("hex").slice(0, 32)
    : undefined;
  return { ipHash, userAgentHash };
}

export function detectGiveawayFraud(input: {
  email: string;
  ipHash?: string | null;
  existingByEmail: boolean;
  existingByUser?: boolean;
  ipEntryCount?: number;
  maxEntriesPerIp?: number;
}): string[] {
  const flags: string[] = [];
  const domain = input.email.split("@")[1]?.toLowerCase();
  if (domain && DISPOSABLE_DOMAINS.has(domain)) {
    flags.push("disposable_email");
  }
  if (input.existingByEmail) flags.push("duplicate_email");
  if (input.existingByUser) flags.push("duplicate_user");
  if (
    input.maxEntriesPerIp != null &&
    input.ipEntryCount != null &&
    input.ipEntryCount >= input.maxEntriesPerIp
  ) {
    flags.push("ip_limit_exceeded");
  }
  return flags;
}

export function shouldBlockEntry(fraudFlags: string[]): boolean {
  return fraudFlags.some((f) =>
    ["duplicate_email", "duplicate_user", "ip_limit_exceeded"].includes(f)
  );
}

export function generateReferralCode(seed: string): string {
  return createHash("sha256")
    .update(seed)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
}

export function generateEntryNumber(sequence: number): string {
  return `GW-${String(sequence).padStart(6, "0")}`;
}

export function generateVerifyToken(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${randomInt(1_000_000_000)}`)
    .digest("hex");
}

export function generateTrackingToken(): string {
  return createHash("sha256")
    .update(`track-${Date.now()}-${randomInt(1_000_000_000)}`)
    .digest("hex")
    .slice(0, 48);
}
