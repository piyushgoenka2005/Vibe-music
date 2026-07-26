import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  deleteRentalProduct,
  getRentalProductById,
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
    const existing = parsed.id ? await getRentalProductById(parsed.id) : null;
    const totalUnits = parsed.totalUnits ?? existing?.totalUnits ?? 1;
    const product = await upsertRentalProduct({
      id: parsed.id ?? randomUUID(),
      slug: parsed.slug || slugify(parsed.name),
      name: parsed.name,
      categoryId: parsed.categoryId,
      catalogProductId: parsed.catalogProductId ?? existing?.catalogProductId ?? null,
      description: parsed.description ?? existing?.description ?? "",
      image: parsed.image ?? existing?.image ?? "",
      images: parsed.images ?? existing?.images ?? [],
      specifications: parsed.specifications ?? existing?.specifications ?? {},
      status: parsed.status ?? existing?.status ?? "active",
      totalUnits,
      availableUnits: parsed.availableUnits ?? existing?.availableUnits ?? totalUnits,
      reservedUnits: existing?.reservedUnits ?? 0,
      minDurationHours: parsed.minDurationHours ?? existing?.minDurationHours ?? 24,
      maxDurationDays: parsed.maxDurationDays ?? existing?.maxDurationDays ?? 30,
      depositAmount: parsed.depositAmount ?? existing?.depositAmount ?? 0,
      hourlyRate: parsed.hourlyRate ?? existing?.hourlyRate ?? 0,
      dailyRate: parsed.dailyRate ?? existing?.dailyRate ?? 0,
      weeklyRate: parsed.weeklyRate ?? existing?.weeklyRate ?? 0,
      monthlyRate: parsed.monthlyRate ?? existing?.monthlyRate ?? 0,
      pickupAvailable: parsed.pickupAvailable ?? existing?.pickupAvailable ?? true,
      deliveryAvailable: parsed.deliveryAvailable ?? existing?.deliveryAvailable ?? true,
      deliveryFee: parsed.deliveryFee ?? existing?.deliveryFee ?? 0,
      pickupFee: parsed.pickupFee ?? existing?.pickupFee ?? 0,
      lateFeePerDay: parsed.lateFeePerDay ?? existing?.lateFeePerDay ?? 0,
      damagePolicy: parsed.damagePolicy ?? existing?.damagePolicy ?? "",
      termsText: parsed.termsText ?? existing?.termsText ?? "",
      agreementText: parsed.agreementText ?? existing?.agreementText ?? "",
      featured: parsed.featured ?? existing?.featured ?? false,
      createdAt: existing?.createdAt ?? now,
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
    return NextResponse.json({ product }, { status: existing ? 200 : 201 });
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
