import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
    enforceMutationSecurity: vi.fn().mockReturnValue(null),
  };
});

vi.mock("@/lib/auth/server-session", () => ({
  getSessionUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/server/adminService", () => ({
  getAdminSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/server/orderService", () => ({
  getOrderById: vi.fn(),
}));

vi.mock("@/lib/server/orderAccess", () => ({
  canAccessOrder: vi.fn(),
}));

vi.mock("@/lib/server/env", () => ({
  isRazorpayConfigured: vi.fn(() => true),
  assertLiveRazorpayKeys: vi.fn(),
  getRazorpayPublicKey: vi.fn(() => "rzp_live_test"),
}));

vi.mock("@/lib/server/orderRepository", () => ({
  updateOrderFields: vi.fn(),
}));

vi.mock("@/lib/server/withTimeout", () => ({
  withTimeout: vi.fn(async (promise: Promise<unknown>) => promise),
}));

vi.mock("razorpay", () => ({
  default: vi.fn().mockImplementation(() => ({
    orders: {
      create: vi.fn().mockResolvedValue({
        id: "order_rzp_resume",
        amount: 1770000,
        currency: "INR",
      }),
    },
  })),
}));

import { POST } from "./route";
import { enforceMutationSecurity } from "@/lib/api/route-utils";
import { getOrderById } from "@/lib/server/orderService";
import { canAccessOrder } from "@/lib/server/orderAccess";

function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/orders/VM-TEST-1/resume-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/orders/[orderId]/resume-payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceMutationSecurity).mockReturnValue(null);
    vi.mocked(canAccessOrder).mockReturnValue(true);
    vi.mocked(getOrderById).mockResolvedValue({
      id: "VM-TEST-1",
      email: "buyer@example.com",
      total: 17700,
      paymentStatus: "pending",
      paymentMethod: "razorpay",
      trackingToken: "tok-123",
      shippingAddress: { name: "Buyer", phone: "9876543210" },
      customerPhone: "9876543210",
    } as Awaited<ReturnType<typeof getOrderById>>);
  });

  it("returns 403 when CSRF check fails", async () => {
    vi.mocked(enforceMutationSecurity).mockReturnValue(
      new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403 }),
    );

    const res = await POST(makeRequest({ email: "buyer@example.com" }), {
      params: Promise.resolve({ orderId: "VM-TEST-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 when order is missing", async () => {
    vi.mocked(getOrderById).mockResolvedValue(null);

    const res = await POST(makeRequest({ email: "buyer@example.com" }), {
      params: Promise.resolve({ orderId: "VM-MISSING" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 when caller cannot access the order", async () => {
    vi.mocked(canAccessOrder).mockReturnValue(false);

    const res = await POST(makeRequest({ email: "wrong@example.com" }), {
      params: Promise.resolve({ orderId: "VM-TEST-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when order is already paid", async () => {
    vi.mocked(getOrderById).mockResolvedValue({
      id: "VM-TEST-1",
      email: "buyer@example.com",
      paymentStatus: "paid",
      trackingToken: "tok-123",
    } as Awaited<ReturnType<typeof getOrderById>>);

    const res = await POST(makeRequest({ email: "buyer@example.com" }), {
      params: Promise.resolve({ orderId: "VM-TEST-1" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { redirectUrl?: string };
    expect(body.redirectUrl).toMatch(/checkout\/success/);
  });

  it("creates a new Razorpay order for pending payment", async () => {
    const res = await POST(makeRequest({ email: "buyer@example.com", trackingToken: "tok-123" }), {
      params: Promise.resolve({ orderId: "VM-TEST-1" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      orderId?: string;
      razorpay?: { orderId?: string; keyId?: string };
    };
    expect(body.orderId).toBe("VM-TEST-1");
    expect(body.razorpay?.orderId).toBe("order_rzp_resume");
    expect(body.razorpay?.keyId).toBe("rzp_live_test");
  });
});
