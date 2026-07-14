import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  activateRentalBooking,
  cancelRentalBooking,
  markRentalReturned,
} from "@/lib/server/rentalBookingService";
import {
  appendRentalStatusEvent,
  getRentalBookingById,
  updateRentalBookingFields,
} from "@/lib/server/rentalRepository";
import {
  adminRentalStatusSchema,
  returnRentalBookingSchema,
} from "@/lib/validations/admin-rental";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("rentals:read");
    const { id } = await context.params;
    const booking = await getRentalBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ booking });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin("rentals:write", request);
    const { id } = await context.params;
    const body = await request.json();

    if (body.action === "return") {
      const parsed = returnRentalBookingSchema.parse(body);
      const booking = await markRentalReturned({
        bookingId: id,
        returnedAt: parsed.returnedAt,
        damageCharge: parsed.damageCharge,
        actorId: admin.uid,
        actorEmail: admin.email,
        request,
      });
      return NextResponse.json({ booking });
    }

    if (body.action === "cancel") {
      const booking = await cancelRentalBooking({
        bookingId: id,
        reason: body.reason,
        actorId: admin.uid,
        actorEmail: admin.email,
        request,
      });
      return NextResponse.json({ booking });
    }

    if (body.action === "activate") {
      await activateRentalBooking(id, admin.uid);
      const booking = await getRentalBookingById(id);
      return NextResponse.json({ booking });
    }

    const parsed = adminRentalStatusSchema.parse(body);
    await updateRentalBookingFields(id, { status: parsed.status });
    await appendRentalStatusEvent({
      bookingId: id,
      status: parsed.status,
      note: parsed.note,
      createdBy: admin.uid,
    });
    await logAuditEvent({
      action: "rental.booking.status_updated",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "rental_booking",
      resourceId: id,
      request,
      metadata: { status: parsed.status },
    });
    const booking = await getRentalBookingById(id);
    return NextResponse.json({ booking });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
