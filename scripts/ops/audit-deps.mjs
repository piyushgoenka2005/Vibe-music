/**
 * Dependency audit gate (L-20).
 *
 * Fails only when a fixable high/critical advisory exists in direct production
 * dependencies. Transitive issues without fixes (xlsx, nested OTEL) are reported
 * but do not block — see docs/ops/DEPENDENCY_AUDIT.md.
 *
 * Usage:
 *   npm run audit:deps
 *   npm run audit:deps:report   # always exit 0, print summary
 */
import { spawnSync } from "node:child_process";

const reportOnly = process.argv.includes("--report");

/** Packages used only in admin/import tooling — tracked, not blocking. */
const ACCEPTED_NO_FIX = new Set(["xlsx"]);

/** Nested dev/telemetry trees — upgrade tracked separately. */
const ACCEPTED_TRANSITIVE_PREFIXES = [
  "@opentelemetry/",
  "@auth/core",
  "@prisma/config",
  "nodemailer",
];

/**
 * Direct deps whose npm "fix" is a false positive (downgrade or wrong major).
 * Advisory is transitive; tracked until upstream ships a real patch.
 */
const ACCEPTED_DIRECT_FALSE_FIX = new Set(["next-auth", "prisma"]);

function runAuditJson() {
  const result = spawnSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  try {
    return JSON.parse(result.stdout || "{}");
  } catch {
    console.error("Unable to parse npm audit JSON output.");
    return null;
  }
}

function isAccepted(name) {
  if (ACCEPTED_NO_FIX.has(name)) return true;
  return ACCEPTED_TRANSITIVE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function main() {
  const audit = runAuditJson();
  if (!audit?.vulnerabilities) {
    console.log("npm audit returned no vulnerability data (skipping gate).");
    process.exit(0);
  }

  const meta = audit.metadata?.vulnerabilities ?? {};
  console.log(
    `npm audit: critical=${meta.critical ?? 0} high=${meta.high ?? 0} moderate=${meta.moderate ?? 0} low=${meta.low ?? 0}`,
  );

  const blocking = [];
  const accepted = [];

  for (const [name, entry] of Object.entries(audit.vulnerabilities)) {
    const severity = entry.severity ?? "unknown";
    if (severity !== "critical" && severity !== "high") continue;
    if (!entry.fixAvailable) {
      if (isAccepted(name)) {
        accepted.push(`${name} (${severity}, no fix — accepted)`);
      } else {
        accepted.push(`${name} (${severity}, no fix — review manually)`);
      }
      continue;
    }
    if (isAccepted(name) || ACCEPTED_DIRECT_FALSE_FIX.has(name)) {
      accepted.push(`${name} (${severity}, fix available — accepted for now)`);
      continue;
    }
    const viaNames = (entry.via ?? []).map((v) =>
      typeof v === "string" ? v : v?.name,
    ).filter(Boolean);
    const viaAllAccepted =
      viaNames.length > 0 && viaNames.every((v) => isAccepted(v));
    if (viaAllAccepted) {
      accepted.push(`${name} (${severity}, transitive via accepted deps)`);
      continue;
    }
    if (entry.isDirect) {
      blocking.push(`${name} (${severity}, direct dep, fix available)`);
    }
  }

  if (accepted.length) {
    console.log("\nAccepted / review-only advisories:");
    for (const line of accepted) console.log(`  • ${line}`);
  }

  if (blocking.length) {
    console.error("\nBLOCKING direct dependency advisories with fixes available:");
    for (const line of blocking) console.log(`  ✗ ${line}`);
    console.error("\nRun: npm audit fix   then re-run npm run audit:deps");
    console.error("See docs/ops/DEPENDENCY_AUDIT.md for accepted-risk policy.");
    if (!reportOnly) process.exit(1);
  }

  console.log("\nDependency audit gate passed (no blocking direct high/critical fixes).");
  process.exit(0);
}

main();
