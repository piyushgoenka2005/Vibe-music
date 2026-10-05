import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/metaCapi", () => ({
  sendMetaCapiEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/api/route-utils", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/api/route-utils")>();
  return {
    ...orig,
    enforceRateLimit: vi.fn().mockResolvedValue(null),
    enforceMutationSecurity: vi.fn().mockReturnValue(null),
  };
});

import { POST } from "./route";
import { sendMetaCapiEvent } from "@/lib/analytics/metaCapi";

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/analytics/meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analytics/meta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("relays InitiateCheckout with shared event_id for deduplication", async () => {
    const res = await POST(
      makePostRequest({
        eventName: "InitiateCheckout",
        eventId: "checkout-prod-1:1",
        eventSourceUrl: "https://vibemusic.in/checkout",
        customData: { value: 4999, currency: "INR", content_ids: ["prod-1"] },
        fbp: "fb.1.123",
      }),
    );

    expect(res.status).toBe(200);
    expect(sendMetaCapiEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "InitiateCheckout",
        eventId: "checkout-prod-1:1",
        customData: expect.objectContaining({ currency: "INR" }),
        userData: expect.objectContaining({ fbp: "fb.1.123" }),
      }),
    );
  });

  it("rejects invalid event names", async () => {
    const res = await POST(
      makePostRequest({
        eventName: "Lead",
        eventId: "lead-1",
      }),
    );
    expect(res.status).toBe(400);
    expect(sendMetaCapiEvent).not.toHaveBeenCalled();
  });
});
