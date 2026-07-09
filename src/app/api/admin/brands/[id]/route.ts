import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getBrandById,
  updateBrand,
  deleteBrand,
} from "@/lib/server/brandRepository";
import { adminBrandSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("categories:read");
    const { id } = await context.params;
    const brand = await getBrandById(id);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json({ brand });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("categories:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminBrandSchema.partial().parse(body);
    const brand = await updateBrand(id, parsed);
    return NextResponse.json({ brand });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdmin("categories:delete", request);
    const { id } = await context.params;
    await deleteBrand(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
