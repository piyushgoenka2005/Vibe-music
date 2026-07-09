import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getReturnRequestById,
  updateReturnRequest,
} from "@/lib/server/returnRequestRepository";
import { adminReturnRequestSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("orders:read");
    const { id } = await context.params;
    const returnRequest = await getReturnRequestById(id);
    if (!returnRequest) {
      return NextResponse.json({ error: "Return request not found" }, { status: 404 });
    }
    return NextResponse.json({ returnRequest });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("orders:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminReturnRequestSchema.parse(body);
    const returnRequest = await updateReturnRequest(id, parsed);
    return NextResponse.json({ returnRequest });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
