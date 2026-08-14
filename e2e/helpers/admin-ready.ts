import fs from "node:fs";
import { E2E_ADMIN_SEED_MARKER } from "./e2e-paths";

/** True when Postgres was seeded for authenticated admin E2E. */
export function isE2EAdminReady(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim()) && fs.existsSync(E2E_ADMIN_SEED_MARKER);
}
