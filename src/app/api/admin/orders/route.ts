import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listAllOrders } from "@/lib/server/adminOrderService";
import type { Order } from "@/types/order";

export async function GET(request: Request) {
  try {
    await requireAdmin("orders:read");
    const { searchParams } = new URL(request.url);
    const result = await listAllOrders({
      status: (searchParams.get("status") as Order["status"]) ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 20),
      offset: Number(searchParams.get("offset") ?? 0),
    });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("orders:read");
    const body = await request.json();

    if (body.export === "csv") {
      const { orders } = await listAllOrders({ limit: 10000 });
      const header = "id,email,status,paymentStatus,total,createdAt\n";
      const rows = orders
        .map(
          (o) =>
            `${o.id},${o.email},${o.status},${o.paymentStatus},${o.total},${o.createdAt ?? ""}`
        )
        .join("\n");
      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="orders.csv"',
        },
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
