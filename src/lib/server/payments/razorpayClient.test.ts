import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import { createRazorpayOrder, fetchRazorpayOrder } from "./razorpayClient";

// Mock the Razorpay SDK fallback
const mockSdkCreate = vi.fn();
const mockSdkFetch = vi.fn();

vi.mock("razorpay", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      orders: {
        create: mockSdkCreate,
        fetch: mockSdkFetch,
      },
    })),
  };
});

describe("razorpayClient — Direct fetch and SDK fallback", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = "rzp_test_12345678901234";
    process.env.RAZORPAY_KEY_SECRET = "secret_12345678901234";
    mockSdkCreate.mockReset();
    mockSdkFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("createRazorpayOrder", () => {
    it("creates an order via direct fetch when forceDirectFetch is enabled", async () => {
      const mockApiResponse = {
        id: "order_direct_123",
        amount: 250000,
        currency: "INR",
        status: "created",
        receipt: "ORD-99999",
      };

      const mockFetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      } as Response);
      global.fetch = mockFetch;

      const result = await createRazorpayOrder(
        {
          amountPaise: 250000,
          currency: "INR",
          receipt: "ORD-99999",
          notes: { test: "true" },
        },
        { forceDirectFetch: true },
      );

      expect(result.id).toBe("order_direct_123");
      expect(result.amount).toBe(250000);
      expect(result.currency).toBe("INR");
      expect(result.receipt).toBe("ORD-99999");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.razorpay.com/v1/orders");
      expect(init?.method).toBe("POST");
      const headers = init?.headers as Record<string, string>;
      expect(headers["Connection"]).toBe("keep-alive");
      expect(headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(init?.body as string);
      expect(body.amount).toBe(250000);
      expect(body.currency).toBe("INR");
      expect(body.receipt).toBe("ORD-99999");
      expect(body.notes).toEqual({ test: "true" });

      // SDK was not invoked
      expect(mockSdkCreate).not.toHaveBeenCalled();
    });

    it("throws Razorpay error directly without SDK fallback on 400 Bad Request", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            description: "Amount must be in integer paise and >= 100",
            field: "amount",
          },
        }),
      });

      await expect(
        createRazorpayOrder(
          {
            amountPaise: 50,
            currency: "INR",
            receipt: "ORD-SHORT",
          },
          { forceDirectFetch: true },
        ),
      ).rejects.toThrow(/Razorpay: Amount must be in integer paise/);

      // Crucial requirement: Do NOT waste another 10s retrying invalid requests with SDK
      expect(mockSdkCreate).not.toHaveBeenCalled();
    });

    it("falls back to SDK when direct fetch encounters a network or socket drop error", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("ECONNRESET: socket hang up"));

      mockSdkCreate.mockResolvedValue({
        id: "order_sdk_fallback_456",
        amount: 50000,
        currency: "INR",
        status: "created",
        receipt: "ORD-FALLBACK",
      });

      const result = await createRazorpayOrder(
        {
          amountPaise: 50000,
          currency: "INR",
          receipt: "ORD-FALLBACK",
        },
        { forceDirectFetch: true },
      );

      expect(result.id).toBe("order_sdk_fallback_456");
      expect(result.amount).toBe(50000);
      expect(result.receipt).toBe("ORD-FALLBACK");
      expect(mockSdkCreate).toHaveBeenCalledTimes(1);
    });

    it("succeeds on direct fetch retry after transient timeout without invoking SDK", async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("The operation was aborted due to timeout"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            id: "order_retry_ok_123",
            amount: 75000,
            currency: "INR",
            receipt: "ORD-RETRY",
          }),
        });

      const result = await createRazorpayOrder(
        {
          amountPaise: 75000,
          currency: "INR",
          receipt: "ORD-RETRY",
        },
        { forceDirectFetch: true },
      );

      expect(result.id).toBe("order_retry_ok_123");
      expect(result.amount).toBe(75000);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockSdkCreate).not.toHaveBeenCalled();
    });

    it("sanitizes long receipts to 40 characters maximum", async () => {
      const veryLongReceipt = "ORD-TEST-1234567890123456789012345678901234567890-EXTRA-LONG";
      expect(veryLongReceipt.length).toBeGreaterThan(40);

      const mockFetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: "order_direct_capped",
          amount: 1000,
          currency: "INR",
          receipt: veryLongReceipt.slice(0, 40),
        }),
      } as Response);
      global.fetch = mockFetch;

      const result = await createRazorpayOrder(
        {
          amountPaise: 1000,
          currency: "INR",
          receipt: veryLongReceipt,
        },
        { forceDirectFetch: true },
      );

      expect(result.receipt?.length).toBeLessThanOrEqual(40);
      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse(init?.body as string);
      expect(body.receipt.length).toBe(40);
      expect(body.receipt).toBe(veryLongReceipt.slice(0, 40));
    });

    it("handles empty or missing receipt gracefully without throwing slice error", async () => {
      const mockFetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: "order_empty_receipt",
          amount: 1000,
          currency: "INR",
        }),
      } as Response);
      global.fetch = mockFetch;

      const result = await createRazorpayOrder(
        {
          amountPaise: 1000,
          currency: "INR",
          receipt: "",
        },
        { forceDirectFetch: true },
      );

      expect(result.id).toBe("order_empty_receipt");
      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse(init?.body as string);
      expect(body.receipt).toBeUndefined();
    });
  });

  describe("fetchRazorpayOrder", () => {
    it("fetches order details via direct fetch", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: "order_fetched_789",
          amount: 150000,
          currency: "INR",
          status: "paid",
        }),
      });

      const result = await fetchRazorpayOrder("order_fetched_789", { forceDirectFetch: true });

      expect(result.id).toBe("order_fetched_789");
      expect(result.amount).toBe(150000);
      expect(result.currency).toBe("INR");
      expect(result.status).toBe("paid");
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(mockSdkFetch).not.toHaveBeenCalled();
    });

    it("falls back to SDK fetch on direct network error", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("ETIMEDOUT: connect timeout"));

      mockSdkFetch.mockResolvedValue({
        id: "order_sdk_fetched_999",
        amount: 80000,
        currency: "INR",
        status: "attempted",
      });

      const result = await fetchRazorpayOrder("order_sdk_fetched_999", { forceDirectFetch: true });

      expect(result.id).toBe("order_sdk_fetched_999");
      expect(result.amount).toBe(80000);
      expect(result.currency).toBe("INR");
      expect(mockSdkFetch).toHaveBeenCalledTimes(1);
    });
  });
});
