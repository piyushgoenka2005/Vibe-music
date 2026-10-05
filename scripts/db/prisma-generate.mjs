import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Prisma schema references env("DATABASE_URL"). CI/Vercel may not inject it during
// `npm install`, so use a harmless placeholder for client generation only.
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL =
    "postgresql://build:build@127.0.0.1:5432/build?schema=public";
}

const prismaEntry = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
const MAX_ATTEMPTS = process.platform === "win32" ? 6 : 1;
const RETRY_DELAY_MS = 750;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runGenerate() {
  return spawnSync(process.execPath, [prismaEntry, "generate"], {
    stdio: "pipe",
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
  });
}

function isLockedEngineError(output) {
  const text = `${output ?? ""}`;
  return (
    text.includes("EPERM") ||
    text.includes("operation not permitted") ||
    text.includes("query_engine-windows.dll.node")
  );
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = runGenerate();

  if (result.status === 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    process.exit(0);
  }

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const locked = process.platform === "win32" && isLockedEngineError(output);
  if (!locked || attempt === MAX_ATTEMPTS) {
    if (locked) {
      const enginePath = path.join(
        process.cwd(),
        "node_modules",
        ".prisma",
        "client",
        "query_engine-windows.dll.node",
      );
      if (fs.existsSync(enginePath)) {
        console.warn(
          "\n[prisma] Skipping client regeneration — query engine is locked by a running Node process, but an existing client is present.",
        );
        console.warn("[prisma] Stop `npm run dev` and run `npm run db:generate` when you need a fresh client.\n");
        process.exit(0);
      }
      console.error(
        "\n[prisma] Could not replace query_engine-windows.dll.node because another Node process is using it.",
      );
      console.error("[prisma] Stop `npm run dev` / Next.js, then run: npm run db:generate\n");
    }
    process.exit(result.status ?? 1);
  }

  console.warn(
    `[prisma] generate attempt ${attempt} failed with a locked engine file; retrying in ${RETRY_DELAY_MS}ms...`,
  );
  await sleep(RETRY_DELAY_MS * attempt);
}

process.exit(1);
