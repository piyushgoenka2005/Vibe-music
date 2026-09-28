/** Indian GSTIN: 15 chars — state code (2) + PAN (10) + entity + Z + checksum. */
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

export function isValidGstin(gstin: string | undefined | null): boolean {
  const value = gstin?.trim().toUpperCase() ?? "";
  return GSTIN_PATTERN.test(value);
}

/** First two digits of GSTIN are the GST state code (e.g. 27 = Maharashtra). */
export function gstStateCodeFromGstin(gstin: string | undefined | null): string {
  const value = gstin?.trim().toUpperCase() ?? "";
  if (!isValidGstin(value)) return "";
  return value.slice(0, 2);
}

/** PAN is embedded in positions 3–12 of a valid GSTIN. */
export function panFromGstin(gstin: string | undefined | null): string | undefined {
  const value = gstin?.trim().toUpperCase() ?? "";
  if (!isValidGstin(value)) return undefined;
  return value.slice(2, 12);
}
