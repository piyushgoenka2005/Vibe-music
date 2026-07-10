import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  listAllShippingZones,
  upsertShippingZone,
} from "@/lib/server/shippingZoneRepository";
import { shippingZoneSchema } from "@/lib/validations/wrFeatures";

export async function GET() {
  try {
    await requireAdmin("settings:read");
    const zones = await listAllShippingZones();
    return NextResponse.json({ zones });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("settings:write", request);
    const body = await request.json();
    const parsed = shippingZoneSchema.parse(body);
    const zone = await upsertShippingZone(parsed);
    return NextResponse.json({ zone });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
