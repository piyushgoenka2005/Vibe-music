import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  deleteProductBundle,
  getBundleByProductId,
  upsertProductBundle,
} from "@/lib/server/bundleService";
import { adminProductBundleSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("products:read");
    const { id } = await context.params;
    const bundle = await getBundleByProductId(id);
    return NextResponse.json({ bundle });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("products:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminProductBundleSchema.parse(body);
    const bundle = await upsertProductBundle(id, parsed);
    return NextResponse.json({ bundle });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("products:write", _request);
    const { id } = await context.params;
    await deleteProductBundle(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
