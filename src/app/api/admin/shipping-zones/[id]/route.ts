import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  deleteShippingZone,
  getShippingZoneById,
  upsertShippingZone,
} from "@/lib/server/shippingZoneRepository";
import { shippingZoneSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("settings:read");
    const { id } = await context.params;
    const zone = await getShippingZoneById(id);
    if (!zone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }
    return NextResponse.json({ zone });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("settings:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = shippingZoneSchema.parse({ ...body, id });
    const zone = await upsertShippingZone(parsed);
    return NextResponse.json({ zone });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdmin("settings:write", request);
    const { id } = await context.params;
    await deleteShippingZone(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
