import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getCustomerDetail,
  updateCustomerStatus,
} from "@/lib/server/adminOrderService";
import { adminCustomerStatusSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("customers:read");
    const { id } = await context.params;
    const customer = await getCustomerDetail(id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json({ customer });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("customers:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminCustomerStatusSchema.parse(body);
    await updateCustomerStatus(id, parsed.isActive);
    const customer = await getCustomerDetail(id);
    return NextResponse.json({ customer });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
