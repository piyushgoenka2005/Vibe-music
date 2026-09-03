import { NextResponse } from "next/server";
import { z } from "zod";
import { toCsv } from "@/lib/api/csv";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listAllOrders } from "@/lib/server/adminOrderService";
import type { Order } from "@/types/order";

const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

const listOrdersQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  search: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  offset: z.coerce.number().int().min(0).optional(),
  cursor: z.string().trim().min(1).max(200).optional(),
});

const exportOrdersSchema = z.object({
  export: z.literal("csv"),
});

export async function GET(request: Request) {
  try {
    await requireAdmin("orders:read");
    const { searchParams } = new URL(request.url);
    const parsed = listOrdersQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ?? 20,
      offset: searchParams.has("offset") ? searchParams.get("offset") : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query" },
        { status: 400 },
      );
    }

    const result = await listAllOrders(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("orders:read", request);
    const parsed = exportOrdersSchema.parse(await request.json());

    if (parsed.export === "csv") {
      const allOrders: Order[] = [];
      let cursor: string | undefined;
      do {
        const batch = await listAllOrders({ limit: 200, cursor });
        allOrders.push(...batch.orders);
        cursor = batch.hasMore ? batch.nextCursor : undefined;
      } while (cursor);

      const csv = toCsv(
        ["id", "email", "status", "paymentStatus", "total", "createdAt"],
        allOrders.map((o) => [
          o.id,
          o.email,
          o.status,
          o.paymentStatus,
          o.total,
          o.createdAt ?? "",
        ]),
      );
      return new NextResponse(csv, {
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
