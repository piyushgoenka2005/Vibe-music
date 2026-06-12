import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  duplicateAdminProduct,
} from "@/lib/server/adminProductService";
import { adminProductSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("products:read");
    const { id } = await context.params;
    const product = await getAdminProduct(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("products:write");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminProductSchema.partial().parse(body);
    const product = await updateAdminProduct(id, parsed);
    return NextResponse.json({ product });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("products:delete");
    const { id } = await context.params;
    await deleteAdminProduct(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin("products:write");
    const { id } = await context.params;
    const body = await request.json();
    if (body.action === "duplicate") {
      const product = await duplicateAdminProduct(id);
      return NextResponse.json({ product }, { status: 201 });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
