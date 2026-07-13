import { NextResponse } from "next/server";
import { enforceRateLimit, jsonError } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

interface PlacesAutocompletePrediction {
  description: string;
  place_id: string;
}

export async function GET(request: Request) {
  const rateLimited = await enforceRateLimit(
    request,
    "address-autocomplete",
    RATE_LIMITS.publicApi
  );
  if (rateLimited) return rateLimited;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ predictions: [], available: false });
  }

  const input = new URL(request.url).searchParams.get("input")?.trim();
  if (!input || input.length < 3) {
    return jsonError("At least 3 characters required", 400);
  }

  const params = new URLSearchParams({
    input,
    key: apiKey,
    components: "country:in",
    types: "address",
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return jsonError("Autocomplete unavailable", 502);
  }

  const data = (await response.json()) as {
    predictions?: PlacesAutocompletePrediction[];
    status?: string;
  };

  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json({ predictions: [] });
  }

  return NextResponse.json({
    available: true,
    predictions: (data.predictions ?? []).map((p) => ({
      description: p.description,
      placeId: p.place_id,
    })),
  });
}
