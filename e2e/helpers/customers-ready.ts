import fs from "node:fs";
import { E2E_CUSTOMERS_SEED_MARKER } from "./e2e-paths";

/** True when Postgres was seeded with E2E storefront customers. */
export function isE2ECustomersReady(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim()) && fs.existsSync(E2E_CUSTOMERS_SEED_MARKER);
}
