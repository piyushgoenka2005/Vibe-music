import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import {
  getGooglePlacesApiKey,
  warnGooglePlacesApiFailure,
  warnIfGooglePlacesMisconfigured,
} from "@/lib/server/googlePlaces";
import { nominatimAutocomplete } from "@/lib/server/nominatimAddress";

interface PlacesAutocompletePrediction {
  description: string;
  place_id: string;
}

const CONFIG_ERROR_STATUSES = new Set([
  "REQUEST_DENIED",
  "INVALID_REQUEST",
  "UNKNOWN_ERROR",
]);

async function googleAutocomplete(input: string, apiKey: string) {
  const params = new URLSearchParams({
    input,
    key: apiKey,
    components: "country:in",
    types: "address",
  });

  let response: Response;
  try {
    response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
      { cache: "no-store" }
    );
  } catch (error) {
    warnGooglePlacesApiFailure(
      "Google Places autocomplete fetch failed",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      "api/address/autocomplete"
    );
    return null;
  }

  if (!response.ok) {
    warnGooglePlacesApiFailure(
      "Google Places autocomplete HTTP error",
      { httpStatus: response.status },
      "api/address/autocomplete"
    );
    return null;
  }

  const data = (await response.json()) as {
    predictions?: PlacesAutocompletePrediction[];
    status?: string;
    error_message?: string;
  };

  const status = data.status ?? "UNKNOWN_ERROR";

  if (status === "OK" || status === "ZERO_RESULTS") {
    return {
      available: true as const,
      predictions: (data.predictions ?? []).map((p) => ({
        description: p.description,
        placeId: p.place_id,
      })),
      provider: "google" as const,
    };
  }

  if (CONFIG_ERROR_STATUSES.has(status)) {
    warnGooglePlacesApiFailure(
      "Google Places autocomplete rejected the request (check API key, billing, and Places API enablement)",
      {
        placesStatus: status,
        errorMessage: data.error_message ?? null,
      },
      "api/address/autocomplete"
    );
    return null;
  }

  warnGooglePlacesApiFailure(
    "Google Places autocomplete returned a non-OK status",
    {
      placesStatus: status,
      errorMessage: data.error_message ?? null,
    },
    "api/address/autocomplete"
  );
  return {
    available: true as const,
    predictions: [],
    provider: "google" as const,
  };
}

export async function GET(request: Request) {
  const rateLimited = await enforceRateLimit(
    request,
    "address-autocomplete",
    RATE_LIMITS.publicApi
  );
  if (rateLimited) return rateLimited;

  const input = new URL(request.url).searchParams.get("input")?.trim();
  if (!input || input.length < 3) {
    return jsonError("At least 3 characters required", 400);
  }

  const apiKey = getGooglePlacesApiKey();
  if (apiKey) {
    const googleResult = await googleAutocomplete(input, apiKey);
    if (googleResult) {
      return NextResponse.json(googleResult);
    }
  } else {
    warnIfGooglePlacesMisconfigured("api/address/autocomplete");
  }

  try {
    const predictions = await nominatimAutocomplete(input);
    return NextResponse.json({
      available: true,
      predictions,
      provider: "nominatim",
    });
  } catch (error) {
    console.warn(
      "[address-autocomplete] Nominatim fallback failed",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({ predictions: [], available: false });
  }
}
