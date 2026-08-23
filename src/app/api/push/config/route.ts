import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushConfigured } from "@/lib/server/pushService";

/** Public — the browser needs the VAPID public key to subscribe. */
export async function GET() {
  return NextResponse.json(
    {
      enabled: isPushConfigured(),
      publicKey: isPushConfigured() ? getVapidPublicKey() : null,
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
