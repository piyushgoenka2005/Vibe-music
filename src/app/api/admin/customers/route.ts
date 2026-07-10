import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listCustomers } from "@/lib/server/adminOrderService";

export async function GET(request: Request) {
  try {
    await requireAdmin("customers:read");
    const { searchParams } = new URL(request.url);

    if (searchParams.get("export") === "csv") {
      const allCustomers: Array<{
        uid: string;
        email: string;
        displayName?: string;
        orderCount?: number;
        totalSpent?: number;
        createdAt?: string;
      }> = [];
      let cursor: string | undefined;
      do {
        const batch = await listCustomers({ limit: 200, cursor });
        allCustomers.push(...batch.customers);
        cursor = batch.hasMore ? batch.nextCursor : undefined;
      } while (cursor);

      const header = "id,email,name,orderCount,totalSpent,createdAt\n";
      const rows = allCustomers
        .map(
          (customer) =>
            `${customer.uid},${customer.email},${customer.displayName ?? ""},${customer.orderCount ?? 0},${customer.totalSpent ?? 0},${customer.createdAt ?? ""}`
        )
        .join("\n");
      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="customers.csv"',
        },
      });
    }

    const result = await listCustomers({
      search: searchParams.get("search") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 20),
      offset: searchParams.has("offset")
        ? Number(searchParams.get("offset") ?? 0)
        : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
