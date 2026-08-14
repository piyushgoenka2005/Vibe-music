import fs from "node:fs";
import path from "node:path";
import { test as setup } from "./fixtures";
import {
  createE2EAdminStorageState,
  E2E_ADMIN_STORAGE_PATH,
} from "./helpers/admin-auth";
import { isE2EAdminReady } from "./helpers/admin-ready";

setup.skip(!isE2EAdminReady(), "DATABASE_URL / seeded E2E admin required for admin auth E2E");

setup("create E2E admin session", async ({ page }) => {
  fs.mkdirSync(path.dirname(E2E_ADMIN_STORAGE_PATH), { recursive: true });
  await createE2EAdminStorageState(page, E2E_ADMIN_STORAGE_PATH);
});