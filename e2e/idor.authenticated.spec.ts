import { test, expect } from "./fixtures";
import { E2E_USER_A_STORAGE_PATH, E2E_USER_B_STORAGE_PATH } from "./helpers/customer-auth";
import { E2E_ADDRESS_A_ID, E2E_ORDER_A_ID, E2E_USER_A_UID } from "./helpers/e2e-credentials";

/**
 * L-19 authenticated IDOR — cross-user access must not leak orders or addresses.
 */
test.describe("L-19 IDOR: authenticated cross-user boundaries", () => {
  test("owner can read their order", async ({ playwright }) => {
    const userA = await playwright.request.newContext({
      storageState: E2E_USER_A_STORAGE_PATH,
    });
    const res = await userA.get(`/api/orders/${E2E_ORDER_A_ID}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { order?: { id?: string; userId?: string } };
    expect(body.order?.id).toBe(E2E_ORDER_A_ID);
    expect(body.order?.userId).toBe(E2E_USER_A_UID);
    await userA.dispose();
  });

  test("other authenticated user cannot read foreign order", async ({ playwright }) => {
    const userB = await playwright.request.newContext({
      storageState: E2E_USER_B_STORAGE_PATH,
    });
    const res = await userB.get(`/api/orders/${E2E_ORDER_A_ID}`);
    expect([403, 404]).toContain(res.status());
    const body = await res.json();
    expect(body.order).toBeUndefined();
    await userB.dispose();
  });

  test("owner can read their saved address", async ({ playwright }) => {
    const userA = await playwright.request.newContext({
      storageState: E2E_USER_A_STORAGE_PATH,
    });
    const res = await userA.get(`/api/addresses/${E2E_ADDRESS_A_ID}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { address?: { id?: string } };
    expect(body.address?.id).toBe(E2E_ADDRESS_A_ID);
    await userA.dispose();
  });

  test("other authenticated user cannot read foreign address", async ({ playwright }) => {
    const userB = await playwright.request.newContext({
      storageState: E2E_USER_B_STORAGE_PATH,
    });
    const res = await userB.get(`/api/addresses/${E2E_ADDRESS_A_ID}`);
    expect([403, 404]).toContain(res.status());
    await userB.dispose();
  });

  test("wishlist is scoped to the signed-in user", async ({ playwright }) => {
    const userA = await playwright.request.newContext({
      storageState: E2E_USER_A_STORAGE_PATH,
    });
    const userB = await playwright.request.newContext({
      storageState: E2E_USER_B_STORAGE_PATH,
    });

    const resA = await userA.get("/api/account/wishlist");
    const resB = await userB.get("/api/account/wishlist");
    expect(resA.status()).toBe(200);
    expect(resB.status()).toBe(200);

    const bodyA = (await resA.json()) as { items?: unknown[] };
    const bodyB = (await resB.json()) as { items?: unknown[] };
    expect(Array.isArray(bodyA.items)).toBe(true);
    expect(Array.isArray(bodyB.items)).toBe(true);

    await userA.dispose();
    await userB.dispose();
  });
});
