#!/usr/bin/env node
/**
 * Clean reinstall when node_modules is corrupt (Windows file locks / partial npm ci).
 * Usage: npm run reinstall:deps
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const nodeModules = path.join(ROOT, "node_modules");
const isWindows = process.platform === "win32";

function log(message) {
  console.log(`==> ${message}`);
}

function warn(message) {
  console.warn(`    WARN: ${message}`);
}

function run(command, options = {}) {
  log(command);
  execSync(command, { stdio: "inherit", cwd: ROOT, env: process.env, ...options });
}

function stopNodeProcesses() {
  if (!isWindows) return;
  const selfPid = process.pid;
  log("Stopping other Node processes (release file locks)");
  spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne ${selfPid} } | Stop-Process -Force -ErrorAction SilentlyContinue`,
    ],
    { stdio: "ignore" },
  );
  execSync("node -e \"setTimeout(()=>{},2000)\"", { stdio: "ignore" });
}

function removeNodeModules() {
  if (!fs.existsSync(nodeModules)) return;

  log("Removing node_modules");
  try {
    fs.rmSync(nodeModules, { recursive: true, force: true, maxRetries: 8, retryDelay: 300 });
  } catch (error) {
    warn(`fs.rmSync failed: ${error.message}`);
  }

  if (fs.existsSync(nodeModules) && isWindows) {
    log("Removing node_modules via rmdir /s /q");
    spawnSync("cmd", ["/c", "rmdir", "/s", "/q", "node_modules"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  if (fs.existsSync(nodeModules)) {
    throw new Error("Could not remove node_modules — close editors/terminals using the project and retry");
  }
}

const major = Number(process.versions.node.split(".")[0]);
if (major >= 23) {
  warn(
    `Node ${process.version} is outside the supported range (>=20.19 <23). Use Node 22 LTS: nvm install 22 && nvm use 22`,
  );
}

stopNodeProcesses();
removeNodeModules();

// --ignore-scripts avoids postinstall racing with incomplete extraction on Windows.
run("npm ci --no-audit --no-fund --ignore-scripts");
run("npm run db:generate");
run("node scripts/ops/verify/verify-node-modules.mjs");
log("Dependency reinstall complete — run: npm run dev");
