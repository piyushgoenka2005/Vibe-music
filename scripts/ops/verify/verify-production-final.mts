/**
 * Single production close-out gate: sign-off + Meta + passive audit + capabilities.
 *
 * Usage:
 *   VERIFY_BASE_URL=https://vibemusic.in npm run verify:production-final
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const BASE = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");

type Capabilities = {
  metaPixelConfigured?: boolean;
  metaCapiConfigured?: boolean;
  gstinConfigured?: boolean;
  analyticsEnabled?: boolean;
};

function runNpm(script: string): number {
  const result = spawnSync("npm", ["run", script], {
    cwd: ROOT,
    env: { ...process.env, VERIFY_BASE_URL: BASE },
    stdio: "inherit",
    shell: true,
  });
  return result.status ?? 1;
}

async function fetchCapabilities(): Promise<Capabilities> {
  const response = await fetch(`${BASE}/api/checkout/capabilities`, { cache: "no-store" });
  if (!response.ok) return {};
  return (await response.json()) as Capabilities;
}

async function main() {
  console.log(`\n══ Production final verification — ${BASE} ══\n`);

  const caps = await fetchCapabilities();
  console.log("Capabilities snapshot:");
  console.log(`  analyticsEnabled:     ${String(caps.analyticsEnabled)}`);
  console.log(`  metaPixelConfigured:  ${String(caps.metaPixelConfigured)}`);
  console.log(`  metaCapiConfigured:   ${String(caps.metaCapiConfigured)}`);
  console.log(`  gstinConfigured:      ${String(caps.gstinConfigured)}\n`);

  const steps = [
    "verify:prod-signoff",
    "verify:meta-pixel:prod",
    "verify:meta-ad-landing:prod",
    "verify:external-audit-passive",
  ];

  let failed = 0;
  for (const step of steps) {
    console.log(`── ${step} ──`);
    const code = runNpm(step);
    if (code !== 0) failed += 1;
  }

  const opsGaps: string[] = [];
  if (!caps.metaCapiConfigured) {
    opsGaps.push(
      "Meta CAPI: Events Manager → Pixel → Conversions API → token → deploy/ops-secrets.env (META_CAPI_ACCESS_TOKEN) → npm run ops:sync-meta-integration-vps",
    );
  }
  if (!caps.gstinConfigured) {
    opsGaps.push(
      "GSTIN: add NEXT_PUBLIC_GSTIN= (15 chars) to deploy/ops-secrets.env → bash deploy/production.sh compliance (on VPS)",
    );
  }

  if (caps.metaPixelConfigured) {
    const homeRes = await fetch(`${BASE}/`, { cache: "no-store" });
    const homeHtml = homeRes.ok ? await homeRes.text() : "";
    if (!homeHtml.includes('name="facebook-domain-verification"')) {
      opsGaps.push(
        "Meta domain: add NEXT_PUBLIC_META_DOMAIN_VERIFICATION to deploy/ops-secrets.env → npm run ops:sync-meta-integration-vps",
      );
    }
  }

  if (opsGaps.length > 0) {
    console.log("\n── Remaining operator steps (secrets not in repo) ──");
    for (const line of opsGaps) console.log(`  • ${line}`);
    console.log(
      "\nLocal helper: fill deploy/ops-secrets.env then run npm run setup:meta-integration -- --from-ops-secrets\n",
    );
  }

  if (failed > 0) {
    console.error(`\n${failed} automated verify script(s) failed.\n`);
    process.exit(1);
  }

  const strictSecrets = process.env.VERIFY_STRICT_SECRETS === "1";

  if (opsGaps.length > 0) {
    if (strictSecrets) {
      console.error(
        "\nVERIFY_STRICT_SECRETS=1 — failing until Meta CAPI, domain tag, and GSTIN are configured.\n",
      );
      process.exit(2);
    }
    console.warn(
      "\nEngineering sign-off complete. Optional operator secrets remain (see above).\n",
      "Re-run with VERIFY_STRICT_SECRETS=1 after deploy/ops-secrets.env is filled for zero-warn compliance.\n",
    );
    return;
  }

  console.log("\nProduction final verification: all automated gates and operator config OK.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
