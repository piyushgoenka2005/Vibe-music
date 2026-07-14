import "server-only";

export interface CodPolicy {
  enabled: boolean;
  /** 0 = no maximum */
  maxOrderValue: number;
  /** Empty = all India PINs eligible */
  pinPrefixes: string[];
}

export interface CodEligibilityInput {
  orderValue: number;
  postalCode?: string | null;
}

export interface CodEligibilityResult {
  eligible: boolean;
  reason: string | null;
  policy: CodPolicy;
}

function parseMaxOrderValue(): number {
  const raw = process.env.COD_MAX_ORDER_VALUE?.trim();
  if (!raw) return 50_000;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return 50_000;
  return value;
}

function parsePinPrefixes(): string[] {
  return (process.env.COD_ALLOWED_PIN_PREFIXES ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** COD rules from env — opt-in only. Default is disabled. */
export function getCodPolicy(): CodPolicy {
  return {
    enabled: process.env.COD_ENABLED === "true",
    maxOrderValue: parseMaxOrderValue(),
    pinPrefixes: parsePinPrefixes(),
  };
}

export function evaluateCodEligibility(
  input: CodEligibilityInput
): CodEligibilityResult {
  const policy = getCodPolicy();

  if (!policy.enabled) {
    return {
      eligible: false,
      reason: "Cash on delivery is not available right now.",
      policy,
    };
  }

  if (policy.maxOrderValue > 0 && input.orderValue > policy.maxOrderValue) {
    return {
      eligible: false,
      reason: `Cash on delivery is limited to orders up to ₹${policy.maxOrderValue.toLocaleString("en-IN")}.`,
      policy,
    };
  }

  const pin = (input.postalCode ?? "").replace(/\D/g, "");
  if (policy.pinPrefixes.length > 0) {
    if (pin.length < 3) {
      return {
        eligible: false,
        reason: "Enter a valid 6-digit PIN to check cash on delivery.",
        policy,
      };
    }
    const allowed = policy.pinPrefixes.some((prefix) =>
      pin.startsWith(prefix.replace(/\D/g, ""))
    );
    if (!allowed) {
      return {
        eligible: false,
        reason: "Cash on delivery is not available for this PIN code.",
        policy,
      };
    }
  }

  return { eligible: true, reason: null, policy };
}

/** Public, non-secret COD flags for checkout capabilities. */
export function getCodCapabilitiesSummary() {
  const policy = getCodPolicy();
  return {
    enabled: policy.enabled,
    maxOrderValue: policy.maxOrderValue,
    pinRestricted: policy.pinPrefixes.length > 0,
    pinPrefixes: policy.pinPrefixes,
  };
}
