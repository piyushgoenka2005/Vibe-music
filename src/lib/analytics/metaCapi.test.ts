import { afterEach, describe, expect, it, vi } from "vitest";

describe("sendMetaCapiEvent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("posts Purchase with order.id event_id for deduplication", async () => {
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123456789012345");
    vi.stubEnv("META_CAPI_ACCESS_TOKEN", "test-capi-token");

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);

    const { sendServerMetaPurchaseEvent } = await import("@/lib/analytics/metaCapi");
    await sendServerMetaPurchaseEvent({
      id: "order-abc-123",
      email: "buyer@example.com",
      customerPhone: "8910482950",
      total: 4999,
      items: [{ productId: "prod-1", name: "Snare", quantity: 1, price: 4999, gstRate: 18 }],
      shippingAddress: {
        name: "Buyer",
        line1: "x",
        city: "Kolkata",
        state: "WB",
        postalCode: "700001",
        country: "IN",
      },
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: "razorpay",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtotal: 4999,
      couponDiscount: 0,
      shippingCharge: 0,
      platformFee: 0,
      totalGst: 0,
      cgst: 0,
      sgst: 0,
      igst: 899.82,
      timeline: [],
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(url).toContain("/123456789012345/events");
    const payload = JSON.parse(init.body) as {
      data: Array<{ event_id: string; event_name: string }>;
    };
    expect(payload.data[0].event_name).toBe("Purchase");
    expect(payload.data[0].event_id).toBe("order-abc-123");
  });
});
