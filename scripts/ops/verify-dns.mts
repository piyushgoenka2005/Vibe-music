#!/usr/bin/env npx tsx
/**
 * Verify GoDaddy DNS A records point at the dedicated VPS IP.
 *
 * Usage:
 *   npm run verify:dns
 *   EXPECTED_IP=109.122.56.126 npm run verify:dns
 */
import dns from "node:dns/promises";

const EXPECTED_IP = (process.env.EXPECTED_IP ?? "109.122.56.126").trim();
const HOSTS = (process.env.VERIFY_DNS_HOSTS ?? "vibemusic.in,www.vibemusic.in,cdn.vibemusic.in,mail.vibemusic.in")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

async function resolveA(host: string): Promise<string[]> {
  try {
    return await dns.resolve4(host);
  } catch {
    return [];
  }
}

async function main() {
  console.log(`\nDNS verify — expected A → ${EXPECTED_IP}\n`);
  let failed = 0;

  for (const host of HOSTS) {
    const addrs = await resolveA(host);
    const ok = addrs.length === 1 && addrs[0] === EXPECTED_IP;
    const status = ok ? "OK" : "FAIL";
    console.log(`  ${status}  ${host.padEnd(22)} → ${addrs.join(", ") || "(none)"}`);
    if (!ok) failed += 1;
  }

  console.log("");
  if (failed > 0) {
    console.log(
      `${failed} host(s) not pointing at ${EXPECTED_IP}. Update GoDaddy A records — see docs/ops/dedicated-ip-migration.md`,
    );
    process.exit(1);
  }

  console.log("All DNS hosts resolve to the dedicated VPS IP.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
