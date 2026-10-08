/**
 * Validates restructure integrity: shims, script paths, storefront aliases.
 * Run: node scripts/ops/validate-codebase-structure.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

// 1. Server shims resolve to real modules
const serverRoot = path.join(root, "src", "lib", "server");
const shimRe = /export \* from "(@\/[^"]+)"/;
for (const entry of fs.readdirSync(serverRoot)) {
  if (!entry.endsWith(".ts") || entry.includes(".test.")) continue;
  const full = path.join(serverRoot, entry);
  const content = fs.readFileSync(full, "utf8");
  if (!content.includes("shim for legacy paths")) continue;
  const match = content.match(shimRe);
  if (!match) {
    errors.push(`Shim ${entry} missing export target`);
    continue;
  }
  const target = match[1].replace(/^@\//, "src/") + ".ts";
  if (!exists(target)) {
    errors.push(`Shim ${entry} → missing ${target}`);
  }
}

// 2. Client service shims
const servicesRoot = path.join(root, "src", "services");
for (const entry of fs.readdirSync(servicesRoot)) {
  if (!entry.endsWith(".ts")) continue;
  const full = path.join(servicesRoot, entry);
  const content = fs.readFileSync(full, "utf8");
  if (!content.includes("shim for legacy paths")) continue;
  const match = content.match(shimRe);
  if (!match) continue;
  const target = match[1].replace(/^@\//, "src/") + ".ts";
  if (!exists(target)) errors.push(`Service shim ${entry} → missing ${target}`);
}

// 3. package.json ops script targets exist
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const [name, script] of Object.entries(pkg.scripts)) {
  if (typeof script !== "string") continue;
  const matches = script.matchAll(/scripts\/ops\/[\w./-]+\.(?:mts|mjs|ps1|sh)/g);
  for (const m of matches) {
    const target = m[0];
    if (!exists(target)) {
      errors.push(`npm script ${name} references missing ${target}`);
    }
  }
}

// 4. Storefront sections alias target
if (!exists("src/components/storefront/sections/DealProductCard.tsx")) {
  errors.push("Missing storefront/sections/DealProductCard.tsx");
}

// 5. Config files
for (const cfg of [
  "config/vitest.config.ts",
  "config/vitest.integration.config.ts",
  "config/vitest.critical-coverage.config.ts",
]) {
  if (!exists(cfg)) errors.push(`Missing ${cfg}`);
}

// 6. No duplicate catalog at repo root
if (exists("products.json")) {
  errors.push("Remove duplicate root products.json (use src/data/catalog/products.json)");
}

if (errors.length > 0) {
  console.error("Structure validation FAILED:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log("Structure validation OK — shims, scripts, and layout checks passed.");
