import fs from "node:fs";
import path from "node:path";
import { test as setup } from "./fixtures";
import { loginAsE2EAdmin, E2E_ADMIN_STORAGE_PATH } from "./helpers/admin-auth";

setup("create E2E admin session", async ({ page }) => {
  setup.skip(
    !process.env.DATABASE_URL,
    "DATABASE_URL required for admin auth E2E"
  );

  fs.mkdirSync(path.dirname(E2E_ADMIN_STORAGE_PATH), { recursive: true });
  await loginAsE2EAdmin(page);
  await page.context().storageState({ path: E2E_ADMIN_STORAGE_PATH });
});
