#!/usr/bin/env bash
# Remove leftover third-party edge-proxy / tunnel packages from an old VPS install.
# Stack is GoDaddy DNS → CloudOnFire VPS → nginx → PM2 (direct origin).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

rm -f /etc/nginx/conf.d/cloudflare-real-ip.conf 2>/dev/null || true
rm -rf "${APP_DIR}/deploy/cloudflare" 2>/dev/null || true

if command -v systemctl >/dev/null 2>&1; then
  systemctl disable --now cloudflared 2>/dev/null || true
fi

rm -rf /etc/cloudflared /root/.cloudflared 2>/dev/null || true
