import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: vi.fn(),
  adminErrorResponse: (error: unknown) => {
    const message = error instanceof Error ? error.message : "Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

describe("GET /api/admin/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero metrics and empty breakdowns when database has no orders", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost:3000/api/admin/reports?range=30d");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.totalGrossRevenue).toBe(0);
    expect(body.totalNetRevenue).toBe(0);
    expect(body.totalOrders).toBe(0);
    expect(body.averageOrderValue).toBe(0);
    expect(body.salesByCategory).toEqual([]);
    expect(body.salesTrend).toEqual([]);
    expect(body.report.totalGrossRevenue).toBe(0);
  });

  it("aggregates live orders into revenue, average order value, category sales and trends", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValueOnce([
      {
        id: "order-1",
        total: 10000,
        subtotal: 8474,
        totalGst: 1526,
        shippingCharge: 0,
        couponDiscount: 0,
        status: "processing",
        paymentStatus: "paid",
        items: [
          {
            productId: "prod-1",
            price: 10000,
            quantity: 1,
          },
        ],
        createdAt: "2026-11-01T10:00:00.000Z",
      },
      {
        id: "order-2",
        total: 5000,
        subtotal: 4237,
        totalGst: 763,
        shippingCharge: 0,
        couponDiscount: 500,
        status: "delivered",
        paymentStatus: "paid",
        items: [
          {
            productId: "prod-2",
            price: 5500,
            quantity: 1,
          },
        ],
        createdAt: "2026-11-02T12:00:00.000Z",
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.order.findMany>>);

    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      { id: "prod-1", category: "Guitars", brand: "Fender" },
      { id: "prod-2", category: "Microphones", brand: "Shure" },
    ] as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>);

    const req = new NextRequest("http://localhost:3000/api/admin/reports?range=30d");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.totalGrossRevenue).toBe(15000);
    expect(body.totalOrders).toBe(2);
    expect(body.averageOrderValue).toBe(7500);
    expect(body.salesByCategory).toHaveLength(2);
    expect(body.salesByCategory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "Guitars", revenue: 10000, orders: 1 }),
        expect.objectContaining({ category: "Microphones", revenue: 5500, orders: 1 }),
      ]),
    );
    expect(body.salesTrend).toHaveLength(2);
  });
});
