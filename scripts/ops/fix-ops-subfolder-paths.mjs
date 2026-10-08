/**
 * Fix REPO_ROOT resolution in scripts moved into verify/, sync/, setup/.
 */
import fs from "node:fs";
import path from "node:path";

const opsRoot = path.join(process.cwd(), "scripts", "ops");
const subdirs = ["verify", "sync", "setup"];
const pattern =
  /path\.resolve\(path\.dirname\(fileURLToPath\(import\.meta\.url\)\), "\.\.\/\.\."\)/g;
const replacement =
  'path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")';

let patched = 0;
for (const sub of subdirs) {
  const dir = path.join(opsRoot, sub);
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir)) {
    if (!entry.endsWith(".mts") && !entry.endsWith(".mjs")) continue;
    const full = path.join(dir, entry);
    const original = fs.readFileSync(full, "utf8");
    const next = original.replace(pattern, replacement);
    if (next !== original) {
      fs.writeFileSync(full, next, "utf8");
      patched += 1;
    }
  }
}

// Remove stale duplicates at ops root when subfolder copy exists.
let removed = 0;
for (const sub of subdirs) {
  const dir = path.join(opsRoot, sub);
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir)) {
    const stale = path.join(opsRoot, entry);
    if (fs.existsSync(stale) && stale !== path.join(dir, entry)) {
      fs.unlinkSync(stale);
      removed += 1;
    }
  }
}

console.log(`fix-ops-subfolder-paths: patched=${patched} removed_stale=${removed}`);
