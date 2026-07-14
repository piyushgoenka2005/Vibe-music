import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { parseGoogleAddressComponents } from "@/lib/address/parseGoogleAddressComponents";
import { getGooglePlacesApiKey } from "@/lib/server/googlePlaces";

interface PlacesAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export async function GET(request: Request) {
  const rateLimited = await enforceRateLimit(
    request,
    "address-details",
    RATE_LIMITS.publicApi
  );
  if (rateLimited) return rateLimited;

  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    return NextResponse.json({ available: false, address: null });
  }

  const placeId = new URL(request.url).searchParams.get("placeId")?.trim();
  if (!placeId) {
    return jsonError("placeId is required", 400);
  }

  const params = new URLSearchParams({
    place_id: placeId,
    key: apiKey,
    fields: "address_component,formatted_address,name",
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return jsonError("Place details unavailable", 502);
  }

  const data = (await response.json()) as {
    status?: string;
    result?: {
      formatted_address?: string;
      name?: string;
      address_components?: PlacesAddressComponent[];
    };
  };

  if (data.status && data.status !== "OK") {
    return NextResponse.json({ available: true, address: null });
  }

  const components = data.result?.address_components ?? [];
  const parsed = parseGoogleAddressComponents(components, {
    formattedAddress: data.result?.formatted_address,
    placeName: data.result?.name,
  });

  return NextResponse.json({
    available: true,
    address: parsed,
  });
}
