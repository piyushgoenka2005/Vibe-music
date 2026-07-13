/**
 * Configure local Postgres, sync env files, ensure secrets, run migrations.
 * Never prints connection secrets.
 *
 * Usage: node scripts/db/setup-local-config.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();

function upsertEnv(file, key, value) {
  const full = path.join(root, file);
  let text = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=`, "m").test(text)) {
    text = text.replace(new RegExp(`^${key}=.*$`, "m"), line);
  } else {
    text = `${text.trimEnd()}\n${line}\n`;
  }
  if (!text.endsWith("\n")) text += "\n";
  fs.writeFileSync(full, text);
  console.log(`updated ${file}: ${key}`);
}

function ensureKey(file, key, factory) {
  const full = path.join(root, file);
  const text = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
  const match = text.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (match && match[1].trim()) {
    console.log(`keep ${file}: ${key}`);
    return;
  }
  upsertEnv(file, key, factory());
}

const adminCandidates = [
  "postgresql://postgres:postgres@localhost:5432/postgres?schema=public",
  "postgresql://vibe:vibe@localhost:5432/vibe?schema=public",
  "postgresql://vibe:vibe@localhost:5433/vibe?schema=public",
];

let adminUrl = null;
for (const url of adminCandidates) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    adminUrl = url;
    await prisma.$disconnect();
    break;
  } catch {
    await prisma.$disconnect().catch(() => {});
  }
}

if (!adminUrl) {
  console.error(
    "No local Postgres is reachable. Start Docker Desktop, then:\n" +
      "  docker compose up -d postgres\n" +
      "Or install PostgreSQL on localhost:5432."
  );
  process.exit(1);
}

const targetUrl = "postgresql://vibe:vibe@localhost:5432/vibe?schema=public";
const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });

try {
  if (adminUrl.includes("postgres:postgres")) {
    await admin.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vibe') THEN
          CREATE ROLE vibe LOGIN PASSWORD 'vibe';
        END IF;
      END
      $$;
    `);
    const dbs = await admin.$queryRawUnsafe(
      `SELECT 1 FROM pg_database WHERE datname = 'vibe'`
    );
    if (!Array.isArray(dbs) || dbs.length === 0) {
      await admin.$executeRawUnsafe(`CREATE DATABASE vibe OWNER vibe`);
    }
    console.log("ensured role+database vibe");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn("bootstrap warn:", message.split("\n")[0].slice(0, 120));
} finally {
  await admin.$disconnect().catch(() => {});
}

const appDb = new PrismaClient({ datasources: { db: { url: targetUrl } } });
try {
  await appDb.$queryRawUnsafe("SELECT 1");
  console.log("app DATABASE_URL reachable on 5432");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("target vibe DB failed:", message.split("\n")[0]);
  process.exit(1);
} finally {
  await appDb.$disconnect().catch(() => {});
}

upsertEnv(".env.local", "DATABASE_URL", targetUrl);
upsertEnv(".env", "DATABASE_URL", targetUrl);

ensureKey(".env.local", "GUEST_ORDER_ACCESS_SECRET", () =>
  randomBytes(32).toString("base64url")
);
ensureKey(".env.local", "AUTH_SECRET", () => randomBytes(32).toString("hex"));

const cdnRoot = path.join(root, ".data", "cdn");
fs.mkdirSync(cdnRoot, { recursive: true });
upsertEnv(".env.local", "CDN_STORAGE_ROOT", cdnRoot.replace(/\\/g, "/"));
upsertEnv(".env.local", "CDN_PUBLIC_BASE_URL", "http://localhost:3000/cdn-local");

ensureKey(".env.local", "SMTP_HOST", () => "mail.vibemusic.in");
ensureKey(".env.local", "SMTP_PORT", () => "587");
ensureKey(".env.local", "SMTP_USER", () => "orders@vibemusic.in");
ensureKey(".env.local", "SMTP_ADMIN_TO", () => "support@vibemusic.in");

const localPath = path.join(root, ".env.local");
let localText = fs.readFileSync(localPath, "utf8");
if (!/^SMTP_PASS=\S/m.test(localText)) {
  if (!/^SMTP_PASS=/m.test(localText)) {
    localText +=
      "\n# Required for real email — set your mailbox password from the VPS mail server\nSMTP_PASS=\n";
    fs.writeFileSync(localPath, localText);
    console.log(
      "added SMTP_PASS placeholder (set real password to enable email)"
    );
  } else {
    console.log("SMTP_PASS still empty — set real mailbox password to enable email");
  }
}

ensureKey(".env.local", "ALLOW_DEMO_PAYMENTS", () => "false");

console.log("running migrations…");
execSync("npm run db:migrate", {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});
console.log("local DB + env configuration complete");
