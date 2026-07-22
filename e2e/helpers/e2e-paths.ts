import path from "node:path";

export const E2E_ADMIN_SEED_MARKER = path.join(
  process.cwd(),
  "e2e",
  ".auth",
  "admin-seeded"
);
