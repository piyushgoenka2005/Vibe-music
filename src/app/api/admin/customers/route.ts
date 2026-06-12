import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listCustomers } from "@/lib/server/adminOrderService";

export async function GET(request: Request) {
  try {
    await requireAdmin("customers:read");
    const { searchParams } = new URL(request.url);
    const result = await listCustomers({
      search: searchParams.get("search") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 20),
      offset: Number(searchParams.get("offset") ?? 0),
    });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
