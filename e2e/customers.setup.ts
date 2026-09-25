import fs from "node:fs";
import path from "node:path";
import { test as setup } from "./fixtures";
import {
  createCustomerStorageState,
  E2E_USER_A_STORAGE_PATH,
  E2E_USER_B_STORAGE_PATH,
} from "./helpers/customer-auth";
import {
  E2E_CUSTOMER_PASSWORD,
  E2E_USER_A_EMAIL,
  E2E_USER_B_EMAIL,
} from "./helpers/e2e-credentials";
import { isE2ECustomersReady } from "./helpers/customers-ready";

setup.skip(
  !isE2ECustomersReady(),
  "DATABASE_URL / seeded E2E customers required for authenticated IDOR E2E",
);

setup("create E2E customer A session", async ({ page }) => {
  fs.mkdirSync(path.dirname(E2E_USER_A_STORAGE_PATH), { recursive: true });
  await createCustomerStorageState(
    page,
    E2E_USER_A_EMAIL,
    E2E_CUSTOMER_PASSWORD,
    E2E_USER_A_STORAGE_PATH,
  );
});

setup("create E2E customer B session", async ({ page }) => {
  fs.mkdirSync(path.dirname(E2E_USER_B_STORAGE_PATH), { recursive: true });
  await createCustomerStorageState(
    page,
    E2E_USER_B_EMAIL,
    E2E_CUSTOMER_PASSWORD,
    E2E_USER_B_STORAGE_PATH,
  );
});
