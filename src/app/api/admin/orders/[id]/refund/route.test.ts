import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-admin", () => {
  class MockAdminAuthError extends Error {
    status: 401 | 403;
    constructor(message: string, status: 401 | 403 = 403) {
      super(message);
      this.name = "AdminAuthError";
      this.status = status;
    }
  }

  return {
    AdminAuthError: MockAdminAuthError,
    requireAdmin: vi.fn(),
    adminErrorResponse: (error: unknown) => {
      const status =
        error instanceof MockAdminAuthError
          ? error.status
          : error &&
              typeof error === "object" &&
              "status" in error &&
              typeof (error as { status?: number }).status === "number"
            ? (error as { status: number }).status
            : 500;
      const message = error instanceof Error ? error.message : "Admin error";
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
});

vi.mock("@/lib/server/orderService", () => ({
  getOrderById: vi.fn(),
}));

vi.mock("@/lib/server/razorpayRefundService", () => ({
  initiateOrderRefund: vi.fn(),
}));

import { POST } from "./route";
import { requireAdmin, AdminAuthError } from "@/lib/auth/require-admin";
import { getOrderById } from "@/lib/server/orderService";
import { initiateOrderRefund } from "@/lib/server/razorpayRefundService";

const adminUser = {
  uid: "admin-1",
  email: "admin@test.com",
  displayName: "Admin",
  role: "super_admin" as const,
  permissions: ["orders:refund"],
};

function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/admin/orders/VM-TEST-1/refund", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/orders/[id]/refund", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(adminUser);
    vi.mocked(getOrderById).mockResolvedValue({
      id: "VM-TEST-1",
      paymentStatus: "paid",
    } as Awaited<ReturnType<typeof getOrderById>>);
    vi.mocked(initiateOrderRefund).mockResolvedValue({
      refundId: "rfnd_test",
      status: "processed",
    });
  });

  it("requires orders:refund permission", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthError("Forbidden", 403));

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "VM-TEST-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when order is missing", async () => {
    vi.mocked(getOrderById).mockResolvedValue(null);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "VM-MISSING" }) });
    expect(res.status).toBe(404);
  });

  it("initiates a refund for a paid order", async () => {
    vi.mocked(getOrderById)
      .mockResolvedValueOnce({
        id: "VM-TEST-1",
        paymentStatus: "paid",
      } as Awaited<ReturnType<typeof getOrderById>>)
      .mockResolvedValueOnce({
        id: "VM-TEST-1",
        paymentStatus: "refunded",
      } as Awaited<ReturnType<typeof getOrderById>>);

    const res = await POST(makeRequest({ amount: 1500, note: "Customer return" }), {
      params: Promise.resolve({ id: "VM-TEST-1" }),
    });

    expect(res.status).toBe(200);
    expect(initiateOrderRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "VM-TEST-1",
        amountPaise: 150000,
        actorEmail: adminUser.email,
        note: "Customer return",
      }),
    );
  });

  it("returns 400 when order has no Razorpay payment", async () => {
    vi.mocked(initiateOrderRefund).mockRejectedValue(new Error("Order has no Razorpay payment"));

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "VM-TEST-1" }) });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/no Razorpay payment/i);
  });
});
