import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  deleteRentalProduct,
  listRentalProducts,
  upsertRentalProduct,
} from "@/lib/server/rentalRepository";
import { adminRentalProductSchema } from "@/lib/validations/admin-rental";
import { slugify } from "@/lib/slug";

export async function GET() {
  try {
    await requireAdmin("rentals:read");
    const products = await listRentalProducts({ status: null });
    return NextResponse.json({ products });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("rentals:write", request);
    const body = await request.json();
    const parsed = adminRentalProductSchema.parse(body);
    const now = new Date().toISOString();
    const totalUnits = parsed.totalUnits ?? 1;
    const product = await upsertRentalProduct({
      id: parsed.id ?? randomUUID(),
      slug: parsed.slug || slugify(parsed.name),
      name: parsed.name,
      categoryId: parsed.categoryId,
      catalogProductId: parsed.catalogProductId ?? null,
      description: parsed.description ?? "",
      image: parsed.image ?? "",
      images: parsed.images ?? [],
      specifications: parsed.specifications ?? {},
      status: parsed.status ?? "active",
      totalUnits,
      availableUnits: parsed.availableUnits ?? totalUnits,
      reservedUnits: 0,
      minDurationHours: parsed.minDurationHours ?? 24,
      maxDurationDays: parsed.maxDurationDays ?? 30,
      depositAmount: parsed.depositAmount ?? 0,
      hourlyRate: parsed.hourlyRate ?? 0,
      dailyRate: parsed.dailyRate ?? 0,
      weeklyRate: parsed.weeklyRate ?? 0,
      monthlyRate: parsed.monthlyRate ?? 0,
      pickupAvailable: parsed.pickupAvailable ?? true,
      deliveryAvailable: parsed.deliveryAvailable ?? true,
      deliveryFee: parsed.deliveryFee ?? 0,
      pickupFee: parsed.pickupFee ?? 0,
      lateFeePerDay: parsed.lateFeePerDay ?? 0,
      damagePolicy: parsed.damagePolicy ?? "",
      termsText: parsed.termsText ?? "",
      agreementText: parsed.agreementText ?? "",
      featured: parsed.featured ?? false,
      createdAt: now,
      updatedAt: now,
    });
    await logAuditEvent({
      action: "rental.product.upserted",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "rental_product",
      resourceId: product.id,
      request,
    });
    return NextResponse.json({ product }, { status: 201 });
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
    await deleteRentalProduct(id);
    await logAuditEvent({
      action: "rental.product.deleted",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "rental_product",
      resourceId: id,
      request,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
