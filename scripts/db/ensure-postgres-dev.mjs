/**
 * Before `npm run dev`, ensure local Postgres matches DATABASE_URL.
 * On Windows, runs npm run db:start when the configured port is closed.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const root = process.cwd();

function loadEnvFile(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return {};
  const out = {};
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

const env = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
};

const databaseUrl = env.DATABASE_URL?.trim();
if (!databaseUrl) {
  process.exit(0);
}

function parsePort(url) {
  try {
    return Number(new URL(url).port || 5432);
  } catch {
    return 5432;
  }
}

function probePort(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.setTimeout(2000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const port = parsePort(databaseUrl);
if (await probePort(port)) {
  process.exit(0);
}

console.warn(
  `\n[vibe] PostgreSQL is not reachable at localhost:${port} (DATABASE_URL).\n` +
    `[vibe] Google sign-in and catalog need the database online.\n`,
);

if (process.platform === "win32") {
  console.warn("[vibe] Starting local PostgreSQL (npm run db:start)…\n");
  const result = spawnSync("npm", ["run", "db:start"], {
    stdio: "inherit",
    shell: true,
    cwd: root,
  });
  if (result.status !== 0) {
    console.error("[vibe] Could not start PostgreSQL. Fix DATABASE_URL or run npm run db:start manually.\n");
    process.exit(result.status ?? 1);
  }
  if (await probePort(port)) {
    console.warn(`[vibe] PostgreSQL is online on port ${port}.\n`);
    process.exit(0);
  }
  console.error(`[vibe] PostgreSQL still unreachable on port ${port} after db:start.\n`);
  process.exit(1);
}

console.warn(
  "[vibe] Start Postgres manually (e.g. docker compose up -d postgres), then re-run npm run dev.\n",
);
process.exit(0);
