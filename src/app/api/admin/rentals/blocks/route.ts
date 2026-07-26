import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  deleteRentalBlock,
  listRentalBlocksForProduct,
  upsertRentalBlock,
} from "@/lib/server/rentalRepository";
import { adminRentalBlockSchema } from "@/lib/validations/admin-rental";

export async function GET(request: Request) {
  try {
    await requireAdmin("rentals:read");
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }
    const blocks = await listRentalBlocksForProduct(productId);
    return NextResponse.json({ blocks });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("rentals:write", request);
    const body = await request.json();
    const parsed = adminRentalBlockSchema.parse(body);
    const now = new Date().toISOString();
    const block = await upsertRentalBlock({
      id: randomUUID(),
      productId: parsed.productId,
      unitId: parsed.unitId ?? null,
      startAt: parsed.startAt,
      endAt: parsed.endAt,
      reason: parsed.reason || "maintenance",
      createdAt: now,
    });
    await logAuditEvent({
      action: "rental.block.created",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "rental_block",
      resourceId: block.id,
      request,
    });
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin("rentals:delete", request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await deleteRentalBlock(id);
    await logAuditEvent({
      action: "rental.block.deleted",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "rental_block",
      resourceId: id,
      request,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
