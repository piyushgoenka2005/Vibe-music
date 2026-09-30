#!/usr/bin/env bash
# One-shot production rebuild on VPS (fixes failed next build / 500s).
set -euo pipefail
cd ~/Vibe-music
LOG="${LOG:-/tmp/vibe-rebuild.log}"

if ! grep -q '\*\*/\*\.test\.ts' tsconfig.json; then
  python3 <<'PY'
import json
from pathlib import Path
p = Path("tsconfig.json")
data = json.loads(p.read_text())
exclude = list(data.get("exclude", []))
for item in ("**/*.test.ts", "**/*.test.tsx"):
    if item not in exclude:
        exclude.append(item)
data["exclude"] = exclude
p.write_text(json.dumps(data, indent=2) + "\n")
PY
fi

pm2 stop vibe vibe-worker 2>/dev/null || true
rm -rf .next
export NODE_ENV=production
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"

{
  echo "==> $(date -Is) starting npm run build"
  npm run build
  echo "==> $(date -Is) build finished"
  pm2 start deploy/ecosystem.config.cjs --update-env
  pm2 save
  sleep 5
  curl -s -o /dev/null -w "checkout:%{http_code}\n" http://127.0.0.1:3000/checkout
  curl -s -o /dev/null -w "account:%{http_code}\n" http://127.0.0.1:3000/account
  curl -s -o /dev/null -w "health:%{http_code}\n" http://127.0.0.1:3000/api/health
  echo "==> $(date -Is) done"
} >>"$LOG" 2>&1
