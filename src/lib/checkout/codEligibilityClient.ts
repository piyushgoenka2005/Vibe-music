export interface CodCapabilities {
  enabled: boolean;
  maxOrderValue: number;
  pinRestricted: boolean;
  pinPrefixes?: string[];
}

export function evaluateCodEligibilityClient(
  cod: CodCapabilities | null | undefined,
  input: { orderValue: number; postalCode?: string | null }
): { eligible: boolean; reason: string | null } {
  if (!cod) {
    return { eligible: true, reason: null };
  }
  if (!cod.enabled) {
    return {
      eligible: false,
      reason: "Cash on delivery is not available right now.",
    };
  }
  if (cod.maxOrderValue > 0 && input.orderValue > cod.maxOrderValue) {
    return {
      eligible: false,
      reason: `Cash on delivery is limited to orders up to ₹${cod.maxOrderValue.toLocaleString("en-IN")}.`,
    };
  }

  const prefixes = cod.pinPrefixes ?? [];
  if (cod.pinRestricted && prefixes.length > 0) {
    const pin = (input.postalCode ?? "").replace(/\D/g, "");
    if (pin.length < 3) {
      return {
        eligible: false,
        reason: "Enter a valid 6-digit PIN to check cash on delivery.",
      };
    }
    const allowed = prefixes.some((prefix) =>
      pin.startsWith(prefix.replace(/\D/g, ""))
    );
    if (!allowed) {
      return {
        eligible: false,
        reason: "Cash on delivery is not available for this PIN code.",
      };
    }
  }

  return { eligible: true, reason: null };
}
