import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { logAuditEvent } from "@/lib/server/auditLog";
import {
  deleteRentalCategory,
  listRentalCategories,
  upsertRentalCategory,
} from "@/lib/server/rentalRepository";
import { adminRentalCategorySchema, adminResourceIdQuerySchema } from "@/lib/validations/admin-rental";
import { slugify } from "@/lib/slug";

export async function GET() {
  try {
    await requireAdmin("rentals:read");
    const categories = await listRentalCategories({ includeDraft: true });
    return NextResponse.json({ categories });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("rentals:write", request);
    const body = await request.json();
    const parsed = adminRentalCategorySchema.parse(body);
    const now = new Date().toISOString();
    const category = await upsertRentalCategory({
      id: parsed.id ?? randomUUID(),
      name: parsed.name,
      slug: parsed.slug || slugify(parsed.name),
      description: parsed.description ?? "",
      imageUrl: parsed.imageUrl || null,
      sortOrder: parsed.sortOrder ?? 0,
      status: parsed.status ?? "active",
      metaTitle: parsed.metaTitle ?? null,
      metaDescription: parsed.metaDescription ?? null,
      createdAt: now,
      updatedAt: now,
    });
    await logAuditEvent({
      action: "rental.category.created",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "rental_category",
      resourceId: category.id,
      request,
    });
    return NextResponse.json({ category }, { status: 201 });
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
    await deleteRentalCategory(id);
    await logAuditEvent({
      action: "rental.category.deleted",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "rental_category",
      resourceId: id,
      request,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
