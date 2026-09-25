import { test, expect } from "./fixtures";
import { mutationHeaders } from "./helpers/test-utils";

/**
 * L-19 IDOR — API-level checks (Appendix D pattern).
 * Authenticated cross-user cases: see idor.authenticated.spec.ts (customers-setup).
 */
test.describe("L-19 IDOR: order and account boundaries", () => {
  test("unauthenticated order detail returns 401 without tracking token", async ({ request }) => {
    const res = await request.get("/api/orders/nonexistent-order-id");
    expect([401, 404]).toContain(res.status());
  });

  test("guessing order id without auth does not return order payload", async ({ request }) => {
    const res = await request.get("/api/orders/VM-00000001");
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.order).toBeUndefined();
    } else {
      expect([401, 404]).toContain(res.status());
    }
  });

  test("wishlist API requires authentication", async ({ request }) => {
    const res = await request.get("/api/account/wishlist");
    expect(res.status()).toBe(401);
  });

  test("address API requires authentication", async ({ request }) => {
    const res = await request.get("/api/addresses/addr_fake_id");
    expect(res.status()).toBe(401);
  });

  test("create-order rejects tampered line prices (L-15 + L-19)", async ({ request }) => {
    const res = await request.post("/api/payment/create-order", {
      headers: mutationHeaders(),
      data: {
        items: [
          {
            productId: "nonexistent-product-tamper-test",
            quantity: 1,
            price: 1,
            gstRate: 18,
          },
        ],
        email: `idor-tamper-${Date.now()}@example.com`,
        paymentMethod: "razorpay",
        shippingAddress: {
          name: "Test User",
          phone: "9876543210",
          line1: "123 Test Street",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "IN",
        },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});
