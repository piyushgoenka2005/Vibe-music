/** Fixed E2E admin — created by `npm run seed:e2e-admin` / Playwright global setup. */
export const E2E_ADMIN_UID = "00000000-e2e0-4000-8000-000000000001";

export const E2E_ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@vibemusic.test";

export const E2E_ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? "E2eAdminPassword!123456";

export function hasE2EAdminCredentials(): boolean {
  return Boolean(E2E_ADMIN_EMAIL && E2E_ADMIN_PASSWORD);
}
