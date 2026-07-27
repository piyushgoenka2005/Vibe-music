import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  deleteRentalUnit,
  listRentalUnits,
  upsertRentalUnit,
} from "@/lib/server/rentalRepository";
import { adminRentalUnitSchema, adminResourceIdQuerySchema } from "@/lib/validations/admin-rental";

export async function GET(request: Request) {
  try {
    await requireAdmin("rentals:read");
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }
    const units = await listRentalUnits(productId);
    return NextResponse.json({ units });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("rentals:write", request);
    const body = await request.json();
    const parsed = adminRentalUnitSchema.parse(body);
    const now = new Date().toISOString();
    const unit = await upsertRentalUnit({
      id: parsed.id ?? randomUUID(),
      productId: parsed.productId,
      serialNumber: parsed.serialNumber ?? null,
      label: parsed.label,
      status: parsed.status ?? "available",
      createdAt: now,
      updatedAt: now,
    });
    await logAuditEvent({
      action: "rental.unit.upserted",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "rental_unit",
      resourceId: unit.id,
      request,
    });
    return NextResponse.json({ unit }, { status: parsed.id ? 200 : 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin("rentals:delete", request);
    const { searchParams } = new URL(request.url);
    const { id } = adminResourceIdQuerySchema.parse({
      id: searchParams.get("id"),
    });
    await deleteRentalUnit(id);
    await logAuditEvent({
      action: "rental.unit.deleted",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "rental_unit",
      resourceId: id,
      request,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
