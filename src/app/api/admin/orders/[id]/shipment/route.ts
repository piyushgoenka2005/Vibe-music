import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getOrderById } from "@/lib/server/orderService";
import {
  addOrderTrackingEvent,
  getOrderShipmentDetails,
  upsertOrderShipment,
} from "@/lib/server/shipmentService";
import {
  addTrackingEventSchema,
  upsertShipmentSchema,
} from "@/lib/validations/shipment";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("orders:read");
    const { id } = await context.params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { shipment, events } = await getOrderShipmentDetails(id);
    return NextResponse.json({ shipment, events });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin("orders:write", request);
    const { id } = await context.params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const parsed = upsertShipmentSchema.parse(await request.json());
    const result = await upsertOrderShipment(
      id,
      {
        trackingNumber: parsed.trackingNumber,
        carrier: parsed.carrier,
        carrierName: parsed.carrierName,
        status: parsed.status,
        estimatedDelivery: parsed.estimatedDelivery,
      },
      admin.email
    );

    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin("orders:write", request);
    const { id } = await context.params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const parsed = addTrackingEventSchema.parse(await request.json());
    const result = await addOrderTrackingEvent(
      id,
      {
        status: parsed.status,
        title: parsed.title,
        description: parsed.description,
        location: parsed.location,
        occurredAt: parsed.occurredAt,
      },
      admin.email
    );

    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
