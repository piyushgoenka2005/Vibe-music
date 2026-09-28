/**
 * Before `npm run dev`, ensure local Postgres matches DATABASE_URL.
 * On Windows, runs start-postgres.ps1 when the configured host/port is not ready.
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

function probeHosts(host, port) {
  const hosts =
    host === "localhost" || host === "::1" || host === "127.0.0.1"
      ? ["127.0.0.1", "::1"]
      : [host];

  return Promise.all(
    hosts.map(
      (target) =>
        new Promise((resolve) => {
          const socket = net.createConnection({ host: target, port });
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
        `PostgreSQL`,
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
      { encoding: "utf8", timeout: 5000 },
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

const target = parseDatabaseTarget(databaseUrl);
if (await isPostgresReady(target)) {
  process.exit(0);
}

function runDbStart() {
  if (process.platform === "win32") {
    const script = path.join(root, "scripts", "db", "start-postgres.ps1");
    return spawnSync(
      "powershell",
      ["-ExecutionPolicy", "Bypass", "-NoProfile", "-File", script],
      { stdio: "inherit", cwd: root },
    );
  }
  return spawnSync("npm", ["run", "db:start"], {
    stdio: "inherit",
    cwd: root,
  });
}

if (process.platform === "win32") {
  console.warn(
    `[vibe] PostgreSQL is offline at ${target.host}:${target.port} — starting local instance…\n`,
  );
  const result = runDbStart();
  if (result.error) {
    console.error(`[vibe] Could not start PostgreSQL: ${result.error.message}`);
    console.error("[vibe] Run npm run db:start manually, then re-run npm run dev.\n");
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error("[vibe] Could not start PostgreSQL. Fix DATABASE_URL or run npm run db:start manually.\n");
    process.exit(result.status ?? 1);
  }
  if (await isPostgresReady(target)) {
    console.warn(`[vibe] PostgreSQL is online at ${target.host}:${target.port}.\n`);
    process.exit(0);
  }
  console.error(
    `[vibe] PostgreSQL still unreachable at ${target.host}:${target.port} after db:start.\n` +
      "[vibe] Tip: use 127.0.0.1 instead of localhost in DATABASE_URL on Windows.\n",
  );
  process.exit(1);
}

console.warn(
  `\n[vibe] PostgreSQL is not reachable at ${target.host}:${target.port} (DATABASE_URL).\n` +
    `[vibe] Google sign-in and catalog need the database online.\n` +
    "[vibe] Start Postgres manually (e.g. docker compose up -d postgres), then re-run npm run dev.\n",
);
process.exit(0);
