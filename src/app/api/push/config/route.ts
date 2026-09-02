import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushConfigured } from "@/lib/server/pushService";

/** Public — the browser needs the VAPID public key to subscribe. */
export async function GET() {
  try {
    return NextResponse.json(
      {
        enabled: isPushConfigured(),
        publicKey: isPushConfigured() ? getVapidPublicKey() : null,
      },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch (error) {
    console.error("[api/push/config] Error:", error);
    return NextResponse.json({ error: "Failed to load push config" }, { status: 500 });
  }
}
