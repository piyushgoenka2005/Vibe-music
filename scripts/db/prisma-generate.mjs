import { spawnSync } from "node:child_process";
import path from "node:path";

// Prisma schema references env("DATABASE_URL"). CI/Vercel may not inject it during
// `npm install`, so use a harmless placeholder for client generation only.
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL =
    "postgresql://build:build@127.0.0.1:5432/build?schema=public";
}

const prismaEntry = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
const result = spawnSync(process.execPath, [prismaEntry, "generate"], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: process.env,
});

process.exit(result.status ?? 1);
