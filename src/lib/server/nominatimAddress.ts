import "server-only";

import type { ParsedPlaceAddress } from "@/lib/address/parseGoogleAddressComponents";
import { matchIndianState } from "@/lib/address/indianStates";

const NOMINATIM_PREFIX = "nominatim:";
const USER_AGENT =
  "VibeMusicStorefront/1.0 (https://vibemusic.in; support@vibemusic.in)";

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimSearchResult {
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
  display_name?: string;
  address?: NominatimAddress;
}

export function isNominatimPlaceId(placeId: string): boolean {
  return placeId.startsWith(NOMINATIM_PREFIX);
}

function toPlaceId(result: NominatimSearchResult): string | null {
  if (!result.osm_type || result.osm_id == null) return null;
  const type = result.osm_type.charAt(0).toUpperCase();
  if (!["N", "W", "R"].includes(type)) return null;
  return `${NOMINATIM_PREFIX}${type}${result.osm_id}`;
}

function parseOsmId(placeId: string): string | null {
  if (!isNominatimPlaceId(placeId)) return null;
  const raw = placeId.slice(NOMINATIM_PREFIX.length).trim().toUpperCase();
  if (!/^[NWR]\d+$/.test(raw)) return null;
  return raw;
}

function mapNominatimAddress(
  address: NominatimAddress | undefined,
  displayName: string
): ParsedPlaceAddress {
  const house = address?.house_number?.trim() ?? "";
  const road = address?.road?.trim() ?? "";
  let line1 = [house, road].filter(Boolean).join(" ").trim();
  if (!line1) {
    line1 = displayName.split(",")[0]?.trim() ?? displayName;
  }

  const line2 =
    address?.neighbourhood?.trim() ||
    address?.suburb?.trim() ||
    "";

  const city =
    address?.city?.trim() ||
    address?.town?.trim() ||
    address?.village?.trim() ||
    address?.county?.trim() ||
    address?.state_district?.trim() ||
    "";

  const stateRaw = address?.state?.trim() ?? "";
  const state = matchIndianState(stateRaw) ?? (stateRaw || "Maharashtra");

  return {
    line1,
    line2: line2 && line2 !== city ? line2 : "",
    city,
    state,
    postalCode: address?.postcode?.replace(/\s+/g, "") ?? "",
    country: address?.country?.trim() || "India",
    formattedAddress: displayName,
  };
}

async function nominatimFetch(url: string): Promise<Response> {
  return fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
}

export async function nominatimAutocomplete(input: string): Promise<
  Array<{ description: string; placeId: string }>
> {
  const params = new URLSearchParams({
    q: input,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "in",
    limit: "8",
  });

  const response = await nominatimFetch(
    `https://nominatim.openstreetmap.org/search?${params}`
  );
  if (!response.ok) {
    throw new Error(`Nominatim search HTTP ${response.status}`);
  }

  const data = (await response.json()) as NominatimSearchResult[];
  if (!Array.isArray(data)) return [];

  return data
    .map((row) => {
      const placeId = toPlaceId(row);
      const description = row.display_name?.trim();
      if (!placeId || !description) return null;
      return { description, placeId };
    })
    .filter((row): row is { description: string; placeId: string } =>
      Boolean(row)
    );
}

export async function nominatimPlaceDetails(
  placeId: string
): Promise<ParsedPlaceAddress | null> {
  const osmId = parseOsmId(placeId);
  if (!osmId) return null;

  const params = new URLSearchParams({
    osm_ids: osmId,
    format: "json",
    addressdetails: "1",
  });

  const response = await nominatimFetch(
    `https://nominatim.openstreetmap.org/lookup?${params}`
  );
  if (!response.ok) {
    throw new Error(`Nominatim lookup HTTP ${response.status}`);
  }

  const data = (await response.json()) as NominatimSearchResult[];
  const row = Array.isArray(data) ? data[0] : undefined;
  if (!row?.display_name) return null;

  return mapNominatimAddress(row.address, row.display_name);
}

/** Address autocomplete is always available via Nominatim when Google Places is unset. */
export function isAddressAutocompleteConfigured(): boolean {
  return true;
}
