#!/usr/bin/env npx tsx
/**
 * Public TLS probe for vibemusic.in on the dedicated VPS IP.
 *
 * Usage:
 *   npm run verify:ssl
 *   VERIFY_HOST=vibemusic.in VERIFY_IP=109.122.56.126 npx tsx scripts/ops/verify-ssl-cert.mts
 */
import tls from "node:tls";

const HOST = (process.env.VERIFY_HOST ?? "vibemusic.in").trim();
const IP = (process.env.VERIFY_IP ?? "109.122.56.126").trim();
const PORT = Number(process.env.VERIFY_PORT ?? "443");
const ATTEMPTS = Number(process.env.VERIFY_SSL_ATTEMPTS ?? "12");
const MIN_OK_RATIO = Number(process.env.VERIFY_SSL_MIN_OK_RATIO ?? "0.9");
const SLEEP_MS = Number(process.env.VERIFY_SSL_SLEEP_MS ?? "250");

const EXPECTED_CN = HOST.replace(/^www\./, "");
const KNOWN_WRONG_CNS = new Set(["git.k12hunar.com", "forgejo", "gitea"]);

type ProbeResult =
  | { ok: true; cn: string; san: string[] }
  | { ok: false; cn?: string; error: string };

function parseSan(raw: tls.PeerCertificate): string[] {
  const out: string[] = [];
  const subjectAltName = raw.subjectaltname ?? "";
  for (const part of subjectAltName.split(",")) {
    const trimmed = part.trim();
    if (trimmed.toLowerCase().startsWith("dns:")) {
      out.push(trimmed.slice(4).trim());
    }
  }
  return out;
}

function certMatchesHost(cn: string | undefined, san: string[]): boolean {
  const names = new Set<string>([cn ?? "", ...san].filter(Boolean));
  return names.has(HOST) || names.has(EXPECTED_CN) || names.has(`www.${EXPECTED_CN}`);
}

function probeOnce(): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: IP,
        port: PORT,
        servername: HOST,
        rejectUnauthorized: true,
        ALPNProtocols: ["http/1.1"],
      },
      () => {
        const peer = socket.getPeerCertificate();
        const cn = peer.subject?.CN;
        const san = parseSan(peer);
        socket.end();
        if (certMatchesHost(cn, san)) {
          resolve({ ok: true, cn: cn ?? "", san });
          return;
        }
        resolve({
          ok: false,
          cn,
          error: `wrong certificate CN=${cn ?? "(none)"} SAN=${san.join(",") || "(none)"}`,
        });
      },
    );

    socket.setTimeout(12_000, () => {
      socket.destroy();
      resolve({ ok: false, error: "TLS handshake timed out" });
    });

    socket.on("error", (error) => {
      const message = error instanceof Error ? error.message : String(error);
      resolve({ ok: false, error: message });
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log(`TLS probe: ${HOST} via ${IP}:${PORT} (${ATTEMPTS} attempts)\n`);

  let ok = 0;
  let bad = 0;
  const failures = new Map<string, number>();

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const result = await probeOnce();
    if (result.ok) {
      ok++;
      console.log(`  attempt ${attempt}: OK CN=${result.cn}`);
    } else {
      bad++;
      const key = result.cn
        ? `CN=${result.cn}`
        : result.error.includes("altnames")
          ? result.error
          : result.error;
      failures.set(key, (failures.get(key) ?? 0) + 1);
      console.log(`  attempt ${attempt}: FAIL ${result.error}`);
    }
    if (attempt < ATTEMPTS) {
      await sleep(SLEEP_MS);
    }
  }

  const ratio = ok / ATTEMPTS;
  console.log(`\nSummary: OK=${ok} FAIL=${bad} (pass threshold ${Math.round(MIN_OK_RATIO * 100)}%)`);

  if (ratio >= MIN_OK_RATIO) {
    console.log("\nPASS — public TLS certificate is stable for vibemusic.in.");
    process.exit(0);
  }

  console.log("\nFAIL — public TLS is unreliable.\n");
  console.log("Failure breakdown:");
  for (const [key, count] of failures.entries()) {
    console.log(`  ${count}x ${key}`);
  }

  const wrongCn = [...failures.keys()].some((key) =>
    [...KNOWN_WRONG_CNS].some((known) => key.toLowerCase().includes(known)),
  );

  if (wrongCn || [...failures.keys()].some((k) => k.includes("git.k12hunar.com"))) {
    console.log(`
Root cause: DNS or routing still hitting legacy shared IP (31.42.125.219)
  Expected dedicated IP: ${IP} (VPS 1055). Another tenant's cert (git.k12hunar.com) means
  GoDaddy A records or local DNS cache may still point at the old address.

Operator actions:
  1. Update GoDaddy A records (@, www, cdn, mail) → 109.122.56.126
  2. See docs/ops/dedicated-ip-migration.md
  3. Run: npm run verify:dns && npm run verify:ssl
`);
  } else {
    console.log(`
Possible causes:
  - Let's Encrypt certificate missing SAN for ${HOST}
  - Incomplete nginx fullchain.pem (missing intermediate)
  - Certificate expired or not yet valid

On VPS (VNC console):
  bash deploy/fix-ssl-certificates.sh
  SYNC_SSL=1 bash deploy/update.sh
`);
  }

  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
