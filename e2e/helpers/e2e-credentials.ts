/** Fixed E2E admin — created by `npm run seed:e2e-admin` / Playwright global setup. */
export const E2E_ADMIN_UID = "00000000-e2e0-4000-8000-000000000001";

export const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@vibemusic.test";

export const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "E2eAdminPassword!123456";

/** Storefront customers for authenticated IDOR E2E — `seed-e2e-customers.mts`. */
export const E2E_USER_A_UID = "00000000-e2e0-4000-8000-000000000002";
export const E2E_USER_B_UID = "00000000-e2e0-4000-8000-000000000003";
export const E2E_USER_A_EMAIL = process.env.E2E_USER_A_EMAIL ?? "e2e-user-a@vibemusic.test";
export const E2E_USER_B_EMAIL = process.env.E2E_USER_B_EMAIL ?? "e2e-user-b@vibemusic.test";
export const E2E_CUSTOMER_PASSWORD =
  process.env.E2E_CUSTOMER_PASSWORD ?? "E2eCustomerPassword!123456";
export const E2E_ORDER_A_ID = "e2e-order-user-a-001";
export const E2E_ADDRESS_A_ID = "e2e-address-user-a-001";

export function hasE2EAdminCredentials(): boolean {
  return Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD);
}
