import { INDIAN_STATES, matchIndianState } from "@/lib/address/indianStates";

export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface ParsedPlaceAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
}

function findComponent(
  components: GoogleAddressComponent[],
  ...types: string[]
): GoogleAddressComponent | undefined {
  for (const type of types) {
    const match = components.find((c) => c.types.includes(type));
    if (match) return match;
  }
  return undefined;
}

export function parseGoogleAddressComponents(
  components: GoogleAddressComponent[],
  options?: { formattedAddress?: string; placeName?: string }
): ParsedPlaceAddress {
  const streetNumber = findComponent(components, "street_number")?.long_name ?? "";
  const route = findComponent(components, "route")?.long_name ?? "";
  const premise = findComponent(components, "premise", "subpremise")?.long_name ?? "";

  const line1Parts = [streetNumber, route].filter(Boolean);
  let line1 = line1Parts.join(" ").trim();
  if (!line1 && premise) line1 = premise;
  if (!line1 && options?.placeName) line1 = options.placeName.trim();
  if (!line1 && options?.formattedAddress) {
    line1 = options.formattedAddress.split(",")[0]?.trim() ?? "";
  }

  const line2 =
    findComponent(
      components,
      "sublocality_level_1",
      "sublocality",
      "neighborhood",
      "sublocality_level_2"
    )?.long_name ?? "";

  const city =
    findComponent(
      components,
      "locality",
      "postal_town",
      "administrative_area_level_3",
      "administrative_area_level_2"
    )?.long_name ?? "";

  const stateRaw =
    findComponent(components, "administrative_area_level_1")?.long_name ?? "";
  const state = matchIndianState(stateRaw) ?? stateRaw;

  const postalCode =
    findComponent(components, "postal_code")?.long_name?.replace(/\s+/g, "") ??
    "";

  const country =
    findComponent(components, "country")?.long_name ?? "India";

  return {
    line1,
    line2: line2 && line2 !== city ? line2 : "",
    city,
    state: state || "Maharashtra",
    postalCode,
    country,
    formattedAddress: options?.formattedAddress?.trim() ?? "",
  };
}

export { INDIAN_STATES };
