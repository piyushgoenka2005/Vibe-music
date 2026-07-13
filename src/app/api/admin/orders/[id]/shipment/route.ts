import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getOrderById } from "@/lib/server/orderService";
import {
  addOrderTrackingEvent,
  getOrderShipmentDetails,
  upsertOrderShipment,
} from "@/lib/server/shipmentService";
import { notifyUserIfAllowed } from "@/lib/server/notificationRepository";
import { sendShipmentUpdateEmail } from "@/lib/server/shipmentEmailService";
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

    if (order.userId) {
      void notifyUserIfAllowed({
        userId: order.userId,
        type: "order_update",
        title: "Shipment update",
        body: `Tracking ${parsed.trackingNumber} — status ${parsed.status ?? result.shipment.status}.`,
        link: `/account/orders/${id}`,
      });
    }

    void sendShipmentUpdateEmail({
      order,
      trackingNumber: parsed.trackingNumber,
      carrier: parsed.carrier,
      carrierName: parsed.carrierName,
      status: parsed.status ?? result.shipment.status,
    });

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

    const { shipment } = await getOrderShipmentDetails(id);
    if (shipment?.trackingNumber) {
      void sendShipmentUpdateEmail({
        order,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        carrierName: shipment.carrierName,
        status: parsed.status || parsed.title,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
