import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { parseGoogleAddressComponents } from "@/lib/address/parseGoogleAddressComponents";
import {
  getGooglePlacesApiKey,
  warnGooglePlacesApiFailure,
  warnIfGooglePlacesMisconfigured,
} from "@/lib/server/googlePlaces";
import {
  isNominatimPlaceId,
  nominatimPlaceDetails,
} from "@/lib/server/nominatimAddress";

interface PlacesAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

const CONFIG_ERROR_STATUSES = new Set([
  "REQUEST_DENIED",
  "INVALID_REQUEST",
  "UNKNOWN_ERROR",
]);

export async function GET(request: Request) {
  const rateLimited = await enforceRateLimit(
    request,
    "address-details",
    RATE_LIMITS.publicApi
  );
  if (rateLimited) return rateLimited;

  const placeId = new URL(request.url).searchParams.get("placeId")?.trim();
  if (!placeId) {
    return jsonError("placeId is required", 400);
  }

  if (isNominatimPlaceId(placeId)) {
    try {
      const address = await nominatimPlaceDetails(placeId);
      if (!address) {
        return NextResponse.json({ available: true, address: null });
      }
      return NextResponse.json({
        available: true,
        address,
        provider: "nominatim",
      });
    } catch (error) {
      console.warn(
        "[address-details] Nominatim lookup failed",
        error instanceof Error ? error.message : error
      );
      return jsonError("Place details unavailable", 502);
    }
  }

  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    warnIfGooglePlacesMisconfigured("api/address/details");
    return NextResponse.json({ available: false, address: null });
  }

  const params = new URLSearchParams({
    place_id: placeId,
    key: apiKey,
    fields: "address_component,formatted_address,name",
  });

  let response: Response;
  try {
    response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
      { cache: "no-store" }
    );
  } catch (error) {
    warnGooglePlacesApiFailure(
      "Google Places details fetch failed",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      "api/address/details"
    );
    return jsonError("Place details unavailable", 502);
  }

  if (!response.ok) {
    warnGooglePlacesApiFailure(
      "Google Places details HTTP error",
      { httpStatus: response.status },
      "api/address/details"
    );
    return jsonError("Place details unavailable", 502);
  }

  const data = (await response.json()) as {
    status?: string;
    error_message?: string;
    result?: {
      formatted_address?: string;
      name?: string;
      address_components?: PlacesAddressComponent[];
    };
  };

  const status = data.status ?? "UNKNOWN_ERROR";

  if (status === "OK") {
    const components = data.result?.address_components ?? [];
    const parsed = parseGoogleAddressComponents(components, {
      formattedAddress: data.result?.formatted_address,
      placeName: data.result?.name,
    });

    return NextResponse.json({
      available: true,
      address: parsed,
      provider: "google",
    });
  }

  if (CONFIG_ERROR_STATUSES.has(status)) {
    warnGooglePlacesApiFailure(
      "Google Places details rejected the request (check API key, billing, and Places API enablement)",
      {
        placesStatus: status,
        errorMessage: data.error_message ?? null,
      },
      "api/address/details"
    );
    return NextResponse.json({ available: false, address: null });
  }

  warnGooglePlacesApiFailure(
    "Google Places details returned a non-OK status",
    {
      placesStatus: status,
      errorMessage: data.error_message ?? null,
    },
    "api/address/details"
  );
  return NextResponse.json({ available: true, address: null });
}
