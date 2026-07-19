import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const prismaEntry = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
const envFile = path.join(process.cwd(), ".env.local");

// Prisma CLI (incl. Studio) reads `.env` only — keep it in sync with `.env.local`.
spawnSync(process.execPath, [path.join(process.cwd(), "scripts", "db", "sync-prisma-env.mjs")], {
  stdio: "inherit",
  cwd: process.cwd(),
});

const nodeArgs = fs.existsSync(envFile)
  ? ["--env-file", envFile, prismaEntry, ...args]
  : [prismaEntry, ...args];

const result = spawnSync(process.execPath, nodeArgs, {
  stdio: "inherit",
  cwd: process.cwd(),
});

process.exit(result.status ?? 1);
