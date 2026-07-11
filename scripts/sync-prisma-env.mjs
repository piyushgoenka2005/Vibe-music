import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const localPath = path.join(root, ".env.local");
const envPath = path.join(root, ".env");

if (!fs.existsSync(localPath)) {
  console.warn("sync-prisma-env: .env.local not found — skipping");
  process.exit(0);
}

const local = fs.readFileSync(localPath, "utf8");
const match = local.match(/^DATABASE_URL=(.+)$/m);

if (!match) {
  console.warn("sync-prisma-env: DATABASE_URL missing in .env.local");
  process.exit(0);
}

const databaseUrl = match[1].trim();
const header =
  "# Prisma CLI reads this file (.env), not .env.local.\n" +
  "# Auto-synced from .env.local — do not commit.\n";

let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : header;

if (/^DATABASE_URL=/m.test(envContent)) {
  envContent = envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${databaseUrl}`);
} else {
  envContent = `${header}DATABASE_URL=${databaseUrl}\n${envContent}`;
}

if (!envContent.startsWith("# Prisma CLI reads")) {
  envContent = `${header}${envContent}`;
}

fs.writeFileSync(envPath, envContent.endsWith("\n") ? envContent : `${envContent}\n`);
console.log("sync-prisma-env: DATABASE_URL synced to .env for Prisma CLI");
