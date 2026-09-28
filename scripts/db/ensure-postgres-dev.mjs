/**
 * Before `npm run dev`, ensure local Postgres matches DATABASE_URL.
 * On Windows, runs start-postgres.ps1 when offline and waits until connections work.
 *
 * Flags:
 *   --nowait  Skip DB wait (npm run dev:nowait — may cause Prisma errors on first load)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const root = process.cwd();
const noWait = process.argv.includes("--nowait");
const MAX_WAIT_MS = 45_000;
const POLL_MS = 250;

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

function parseDatabaseTarget(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "localhost",
      port: Number(parsed.port || 5432),
      user: decodeURIComponent(parsed.username || "postgres"),
      database: (parsed.pathname || "/postgres").replace(/^\//, "") || "postgres",
    };
  } catch {
    return { host: "localhost", port: 5432, user: "postgres", database: "postgres" };
  }
}

function probeHosts(host, port, timeoutMs = 400) {
  const hosts =
    host === "localhost" || host === "::1" || host === "127.0.0.1"
      ? ["127.0.0.1", "::1"]
      : [host];

  return Promise.all(
    hosts.map(
      (target) =>
        new Promise((resolve) => {
          const socket = net.createConnection({ host: target, port });
          socket.setTimeout(timeoutMs);
          socket.on("connect", () => {
            socket.destroy();
            resolve(true);
          });
          socket.on("error", () => resolve(false));
          socket.on("timeout", () => {
            socket.destroy();
            resolve(false);
          });
        }),
    ),
  ).then((results) => results.some(Boolean));
}

function findPgIsReady() {
  if (process.platform === "win32") {
    for (const version of ["17", "18"]) {
      const candidate = path.join(
        "C:",
        "Program Files",
        "PostgreSQL",
        version,
        "bin",
        "pg_isready.exe",
      );
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  }
  return "pg_isready";
}

function verifyPostgresReady(target) {
  const pgIsReady = findPgIsReady();
  if (!pgIsReady) {
    return false;
  }

  const hosts =
    target.host === "localhost" || target.host === "::1" || target.host === "127.0.0.1"
      ? ["127.0.0.1", target.host === "::1" ? "::1" : "localhost"]
      : [target.host];

  for (const host of hosts) {
    const result = spawnSync(
      pgIsReady,
      ["-h", host, "-p", String(target.port), "-U", target.user, "-d", target.database],
      { encoding: "utf8", timeout: 2000, windowsHide: true },
    );
    if (result.status === 0) {
      return true;
    }
  }
  return false;
}

async function isPostgresReady(target) {
  if (verifyPostgresReady(target)) {
    return true;
  }
  if (!findPgIsReady()) {
    return probeHosts(target.host, target.port);
  }
  return false;
}

function startPostgresScriptPath() {
  return path.join(root, "scripts", "db", "start-postgres.ps1");
}

function runDbStartSync() {
  if (process.platform === "win32") {
    return spawnSync(
      "powershell",
      ["-ExecutionPolicy", "Bypass", "-NoProfile", "-File", startPostgresScriptPath()],
      { stdio: "inherit", cwd: root, windowsHide: true },
    );
  }
  return spawnSync("npm", ["run", "db:start"], {
    stdio: "inherit",
    cwd: root,
  });
}

async function waitForPostgres(target) {
  process.stdout.write("[vibe] Waiting for PostgreSQL");
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    if (await isPostgresReady(target)) {
      process.stdout.write(" ready.\n");
      return true;
    }
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  process.stdout.write(" timed out.\n");
  return false;
}

const target = parseDatabaseTarget(databaseUrl);
if (await isPostgresReady(target)) {
  process.exit(0);
}

if (process.platform === "win32") {
  if (noWait) {
    console.warn(
      `[vibe] PostgreSQL is offline at ${target.host}:${target.port} — starting (no wait)…`,
    );
  } else {
    console.warn(
      `[vibe] PostgreSQL is offline at ${target.host}:${target.port} — starting local instance…`,
    );
  }

  const result = runDbStartSync();
  if (result.error) {
    console.error(`[vibe] Could not start PostgreSQL: ${result.error.message}`);
    console.error("[vibe] Run npm run db:start manually, then npm run dev:turbo.\n");
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(
      "[vibe] Could not start PostgreSQL. Fix DATABASE_URL or run npm run db:start manually.\n",
    );
    process.exit(result.status ?? 1);
  }

  if (noWait) {
    process.exit(0);
  }

  if (await isPostgresReady(target)) {
    console.warn(`[vibe] PostgreSQL is online at ${target.host}:${target.port}.\n`);
    process.exit(0);
  }

  if (await waitForPostgres(target)) {
    console.warn(`[vibe] PostgreSQL is online at ${target.host}:${target.port}.\n`);
    process.exit(0);
  }

  console.error(
    `[vibe] PostgreSQL still unreachable at ${target.host}:${target.port} after startup.\n` +
      "[vibe] Check .data/postgres/server.log or run: npm run db:start\n",
  );
  process.exit(1);
}

console.warn(
  `\n[vibe] PostgreSQL is not reachable at ${target.host}:${target.port} (DATABASE_URL).\n` +
    `[vibe] Start Postgres manually, then npm run dev:turbo.\n`,
);
process.exit(0);
