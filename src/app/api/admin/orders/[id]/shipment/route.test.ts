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

vi.mock("@/lib/server/shipmentService", () => ({
  getOrderShipmentDetails: vi.fn(),
  upsertOrderShipment: vi.fn(),
  addOrderTrackingEvent: vi.fn(),
}));

vi.mock("@/lib/server/notificationRepository", () => ({
  notifyUserIfAllowed: vi.fn(),
}));

vi.mock("@/lib/server/shipmentEmailService", () => ({
  sendShipmentUpdateEmail: vi.fn(),
}));

import { GET, PUT } from "./route";
import { requireAdmin, AdminAuthError } from "@/lib/auth/require-admin";
import { getOrderById } from "@/lib/server/orderService";
import { getOrderShipmentDetails, upsertOrderShipment } from "@/lib/server/shipmentService";

const adminUser = {
  uid: "admin-1",
  email: "admin@test.com",
  displayName: "Admin",
  role: "super_admin" as const,
  permissions: ["orders:write", "orders:read"],
};

describe("admin order shipment routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(adminUser);
    vi.mocked(getOrderById).mockResolvedValue({
      id: "VM-TEST-1",
      userId: "user-1",
    } as Awaited<ReturnType<typeof getOrderById>>);
    vi.mocked(getOrderShipmentDetails).mockResolvedValue({
      shipment: { trackingNumber: "TRK123", status: "in_transit" },
      events: [],
    });
    vi.mocked(upsertOrderShipment).mockResolvedValue({
      shipment: { trackingNumber: "TRK123", status: "in_transit" },
    });
  });

  it("GET requires admin read access", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new AdminAuthError("Authentication required", 401));

    const res = await GET(new Request("http://localhost/api/admin/orders/VM-TEST-1/shipment"), {
      params: Promise.resolve({ id: "VM-TEST-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("GET returns shipment details for an order", async () => {
    const res = await GET(new Request("http://localhost/api/admin/orders/VM-TEST-1/shipment"), {
      params: Promise.resolve({ id: "VM-TEST-1" }),
    });

    expect(res.status).toBe(200);
    expect(requireAdmin).toHaveBeenCalledWith("orders:read");
    const body = (await res.json()) as { shipment?: { trackingNumber?: string } };
    expect(body.shipment?.trackingNumber).toBe("TRK123");
  });

  it("PUT upserts shipment tracking for an order", async () => {
    const res = await PUT(
      new Request("http://localhost/api/admin/orders/VM-TEST-1/shipment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: "TRK123456789",
          carrier: "bluedart",
          status: "in_transit",
        }),
      }),
      { params: Promise.resolve({ id: "VM-TEST-1" }) },
    );

    expect(res.status).toBe(200);
    expect(upsertOrderShipment).toHaveBeenCalledWith(
      "VM-TEST-1",
      expect.objectContaining({
        trackingNumber: "TRK123456789",
        carrier: "bluedart",
      }),
      adminUser.email,
    );
  });
});
