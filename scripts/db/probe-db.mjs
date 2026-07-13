/**
 * Probe DATABASE_URL from .env / .env.local (and 5433→5432 swap).
 * Prints only reachability + port — never the connection string.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const dataDir = path.join(root, ".data");

function writeProbeMarker(name, contents) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, name), contents);
}

function readUrl(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return null;
  const text = fs.readFileSync(full, "utf8");
  const match = text.match(/^DATABASE_URL=(.+)$/m);
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

function portOf(url) {
  const m = url.match(/:(\d+)\//);
  return m?.[1] ?? "?";
}

const base = readUrl(".env.local") ?? readUrl(".env");
if (!base) {
  console.log("NO_DATABASE_URL");
  process.exit(1);
}

const candidates = [
  ...new Set([
    base,
    base.replace(":5433/", ":5432/"),
    base.replace("@localhost:5433", "@localhost:5432"),
    base.replace("@127.0.0.1:5433", "@127.0.0.1:5432"),
  ]),
];

for (const url of candidates) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    const port = portOf(url);
    console.log(`REACHABLE_PORT=${port}`);
    writeProbeMarker("db-port", `${port}\n`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`FAIL_PORT=${portOf(url)} code=${error?.code ?? "?"} msg=${message.split("\n")[0].slice(0, 160)}`);
    await prisma.$disconnect().catch(() => {});
  }
}

// Also try documented local Docker defaults if file URL failed
const defaults = [
  "postgresql://vibe:vibe@localhost:5432/vibe?schema=public",
  "postgresql://vibe:vibe@localhost:5433/vibe?schema=public",
  "postgresql://postgres:postgres@localhost:5432/postgres?schema=public",
];

for (const url of defaults) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log(`REACHABLE_DEFAULT_PORT=${portOf(url)}`);
    writeProbeMarker("db-port", `${portOf(url)}\n`);
    writeProbeMarker("db-default", "vibe:vibe\n");
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`FAIL_DEFAULT_PORT=${portOf(url)} code=${error?.code ?? "?"} msg=${message.split("\n")[0].slice(0, 160)}`);
    await prisma.$disconnect().catch(() => {});
  }
}

process.exit(2);
