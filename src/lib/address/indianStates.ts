/** Canonical Indian states/UTs for checkout + Places mapping. */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

const ALIASES: Record<string, IndianState> = {
  "nct of delhi": "Delhi",
  "national capital territory of delhi": "Delhi",
  "orissa": "Odisha",
  "uttaranchal": "Uttarakhand",
  "pondicherry": "Puducherry",
};

export function matchIndianState(raw: string): IndianState | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;

  const alias = ALIASES[normalized];
  if (alias) return alias;

  const exact = INDIAN_STATES.find((state) => state.toLowerCase() === normalized);
  if (exact) return exact;

  const partial = INDIAN_STATES.find(
    (state) =>
      normalized.includes(state.toLowerCase()) ||
      state.toLowerCase().includes(normalized)
  );
  return partial ?? null;
}
