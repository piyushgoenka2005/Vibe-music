/**
 * Group flat scripts/ops into verify/, sync/, setup/ subfolders.
 * Updates package.json, deploy scripts, and cross-references.
 * Run: node scripts/ops/organize-ops-scripts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const opsRoot = path.join(root, "scripts", "ops");

const PREFIX_DIRS = [
  { prefix: "verify-", dir: "verify" },
  { prefix: "sync-", dir: "sync" },
  { prefix: "setup-", dir: "setup" },
];

const KEEP_AT_ROOT = new Set([
  "load-merged-env.mjs",
  "merge-ops-secrets.mjs",
  "clean-next-cache.mjs",
  "ensure-dev-deps.mjs",
  "reinstall-deps.mjs",
  "register-cli-stubs-side-effect.mts",
  "organize-ops-scripts.mjs",
  "apply-codebase-structure.mjs",
  "normalize-production-env.mjs",
  "audit-deps.mjs",
  "check-env.mjs",
  "check-cwv.mjs",
  "check-cwv-strict.mjs",
  "check-edge-headers.mjs",
  "check-gstin-env.mts",
  "configuration-status.mts",
  "generate-vapid-keys.mjs",
  "read-store-gstin.mts",
  "release-ready.mts",
  "release-stale-reservations.mts",
  "reconcile-product-review-aggregates.mts",
  "error-monitoring-ping.mts",
  "synthetic-checkout-monitor.mts",
  "lighthouse-audit.mjs",
  "load-test.mts",
  "smoke-check.mts",
  "prod-signoff.mts",
  "phase8-deploy-status.mts",
  "publish-independence-banner.mts",
  "seed-production-ops.mts",
  "update-social-rail-links.mts",
  "close-f14-payment-proof.mts",
  "analyze-product-image-framing.mts",
  "compress-style-story-videos.sh",
  "run-verify-razorpay-ops.mjs",
  "generate-vibemusic-audit-json.mts",
  "audit-deps.mjs",
  "ssh-vps.ps1",
  "verify-ssh.ps1",
  "fix-ssh-known-host.ps1",
  "setup-deploy-access.ps1",
  "sync-cdn-to-vps.ps1",
]);

function replacePaths(content) {
  let next = content;
  for (const { prefix, dir } of PREFIX_DIRS) {
    // Only rewrite script paths (not bare prefixes inside longer filenames like sync-cdn-to-vps.ps1).
    const re = new RegExp(`scripts/ops/${prefix.replace("-", "\\-")}([\\w.-]+\\.(?:mts|mjs))`, "g");
    next = next.replace(re, `scripts/ops/${dir}/${prefix}$1`);
  }
  return next;
}

let moved = 0;
for (const { prefix, dir } of PREFIX_DIRS) {
  const targetDir = path.join(opsRoot, dir);
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(opsRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.startsWith(prefix)) continue;
    if (KEEP_AT_ROOT.has(entry.name)) continue;
    const src = path.join(opsRoot, entry.name);
    const dest = path.join(targetDir, entry.name);
    if (fs.existsSync(dest)) continue;
    execSync(`git mv "${src.replace(/\\/g, "/")}" "${dest.replace(/\\/g, "/")}"`, {
      stdio: "inherit",
    });
    moved += 1;
  }
}

const pkgPath = path.join(root, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
for (const [key, value] of Object.entries(pkg.scripts)) {
  if (typeof value === "string") {
    pkg.scripts[key] = replacePaths(value);
  }
}
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

const filesToPatch = [
  "deploy/update.sh",
  "deploy/production.sh",
  "deploy/repair-deps.sh",
  "deploy/ecosystem.config.cjs",
  "README.md",
  "docs/INCIDENT_RESPONSE.md",
  ".github/workflows/deploy-production.yml",
];

for (const rel of filesToPatch) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) continue;
  const original = fs.readFileSync(full, "utf8");
  const patched = replacePaths(original);
  if (patched !== original) {
    fs.writeFileSync(full, patched, "utf8");
  }
}

// Patch internal ops cross-references
for (const { dir } of PREFIX_DIRS) {
  const folder = path.join(opsRoot, dir);
  if (!fs.existsSync(folder)) continue;
  for (const entry of fs.readdirSync(folder)) {
    const full = path.join(folder, entry);
    if (!entry.endsWith(".mts") && !entry.endsWith(".mjs") && !entry.endsWith(".md")) continue;
    const original = fs.readFileSync(full, "utf8");
    const patched = replacePaths(original);
    if (patched !== original) fs.writeFileSync(full, patched, "utf8");
  }
}

console.log(`Organized scripts/ops — moved ${moved} files into verify/, sync/, setup/`);
