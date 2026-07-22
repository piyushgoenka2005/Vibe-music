import fs from "node:fs";
import path from "node:path";
import { test as setup } from "./fixtures";
import { loginAsE2EAdmin, E2E_ADMIN_STORAGE_PATH } from "./helpers/admin-auth";
import { E2E_ADMIN_SEED_MARKER } from "./helpers/e2e-paths";

const adminSeedReady =
  Boolean(process.env.DATABASE_URL) && fs.existsSync(E2E_ADMIN_SEED_MARKER);

setup.skip(
  !adminSeedReady,
  "DATABASE_URL / seeded E2E admin required for admin auth E2E"
);

setup("create E2E admin session", async ({ page }) => {
  fs.mkdirSync(path.dirname(E2E_ADMIN_STORAGE_PATH), { recursive: true });
  await loginAsE2EAdmin(page);
  await page.context().storageState({ path: E2E_ADMIN_STORAGE_PATH });
});
