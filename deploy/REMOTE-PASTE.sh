# Paste this ENTIRE block into your SSH session (root@87.232.72.14)
# It hot-patches the crash, rebuilds, and enables HTTPS.

set -e
APP_DIR=$(find /root /var/www /home -maxdepth 4 -name package.json 2>/dev/null | while read f; do
  grep -q '"name": "vibe"' "$f" 2>/dev/null && dirname "$f" && break
done | head -1)
[ -z "$APP_DIR" ] && APP_DIR=/root/Vibe-music
echo "Using APP_DIR=$APP_DIR"
cd "$APP_DIR"

# Hot-fix instrumentation crash (Firestore FAST_FAIL) if old build on server
INSTR="src/instrumentation.ts"
if [ -f "$INSTR" ] && grep -q "Firestore initialization failed" "$INSTR"; then
  cp -a "$INSTR" "${INSTR}.bak.$(date +%s)"
  python3 - <<'PY'
from pathlib import Path
p = Path("src/instrumentation.ts")
text = p.read_text()
old = '''      if (!firestoreHealth.ok && process.env.NODE_ENV === "production") {
        throw new Error(
          `Firestore initialization failed: ${firestoreHealth.error ?? "unknown"}`
        );
      }'''
new = '''      if (!firestoreHealth.ok) {
        const { markFirestoreUnavailable } = await import("@/lib/server/firestoreErrors");
        markFirestoreUnavailable(new Error(firestoreHealth.error ?? "Firestore unavailable"));
      }'''
if old in text:
    p.write_text(text.replace(old, new))
    print("Patched Firestore hard-fail")
else:
    print("Firestore patch not needed or already applied")
PY
fi

# Ensure production URL in env
for EF in .env.production .env.local .env; do
  [ -f "$EF" ] || continue
  grep -q NEXT_PUBLIC_SITE_URL "$EF" || echo "NEXT_PUBLIC_SITE_URL=https://vibemusic.in" >> "$EF"
  sed -i 's|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://vibemusic.in|' "$EF"
  grep -q FIRESTORE_STARTUP_DEADLINE_MS "$EF" || echo "FIRESTORE_STARTUP_DEADLINE_MS=15000" >> "$EF"
  break
done

npm ci --omit=dev
NODE_ENV=production npm run build

# Restart — Next.js auto-loads .env.production when NODE_ENV=production
pm2 delete vibe 2>/dev/null || true
if [ -f deploy/ecosystem.config.cjs ]; then
  pm2 start deploy/ecosystem.config.cjs --update-env
else
  NODE_ENV=production pm2 start npm --name vibe -- start
fi
pm2 save

# Nginx + SSL (if deploy scripts present)
if [ -f deploy/go-live.sh ]; then
  # Skip rebuild in go-live — already built above
  SKIP_BUILD=1 SKIP_PM2=1 bash deploy/go-live.sh
else
  echo "Run SSL setup manually — see deploy/nginx/ configs"
  curl -sS -o /dev/null -w "App :3000 → %{http_code}\n" http://127.0.0.1:3000/
fi
