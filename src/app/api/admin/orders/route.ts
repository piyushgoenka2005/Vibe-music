import { NextResponse } from "next/server";
import { z } from "zod";
import { toCsv } from "@/lib/api/csv";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listAllOrders } from "@/lib/server/adminOrderService";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

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
  paymentStatus: z.string().trim().optional(),
  search: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  offset: z.coerce.number().int().min(0).optional(),
  cursor: z.string().trim().min(1).max(200).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  export: z.string().optional(),
});

const exportOrdersSchema = z.object({
  export: z.literal("csv"),
  status: z.string().trim().optional(),
  paymentStatus: z.string().trim().optional(),
  search: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

function buildExportWhere(filters: {
  status?: string;
  paymentStatus?: string;
  search?: string;
  from?: string;
  to?: string;
}): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }
  if (filters.search) {
    const s = filters.search;
    where.OR = [
      { id: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { customerName: { contains: s, mode: "insensitive" } },
      { customerPhone: { contains: s, mode: "insensitive" } },
    ];
  }
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  return where;
}

async function exportOrdersCsv(where: Prisma.OrderWhereInput) {
  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const csv = toCsv(
    [
      "id",
      "customerName",
      "email",
      "status",
      "paymentStatus",
      "paymentMethod",
      "subtotal",
      "totalGst",
      "shippingCharge",
      "total",
      "createdAt",
    ],
    rows.map((o) => [
      o.id,
      o.customerName ?? "",
      o.email,
      o.status,
      o.paymentStatus,
      o.paymentMethod ?? "",
      o.subtotal,
      o.totalGst,
      o.shippingCharge,
      o.total,
      o.createdAt ?? "",
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orders.csv"',
    },
  });
}

export async function GET(request: Request) {
  try {
    await requireAdmin("orders:read");
    const { searchParams } = new URL(request.url);
    const parsed = listOrdersQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      paymentStatus: searchParams.get("paymentStatus") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ?? 20,
      offset: searchParams.has("offset") ? searchParams.get("offset") : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      export: searchParams.get("export") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query" },
        { status: 400 },
      );
    }

    if (parsed.data.export === "csv") {
      const where = buildExportWhere(parsed.data);
      return exportOrdersCsv(where);
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
    const body = await request.json();
    const parsed = exportOrdersSchema.safeParse(body);

    if (parsed.success && parsed.data.export === "csv") {
      const where = buildExportWhere(parsed.data);
      return exportOrdersCsv(where);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
