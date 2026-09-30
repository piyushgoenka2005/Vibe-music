#!/usr/bin/env bash
# Cloudflare Tunnel — fixes SSL when CloudOnFire shares 31.42.125.219 with another VM.
# Prereq: vibemusic.in added to Cloudflare; nameservers pointed to Cloudflare (see docs/ops/CLOUDFLARE-TUNNEL-SSL.md).
#
# One-time (browser): cloudflared tunnel login
# Then: sudo bash deploy/cloudflare/setup-tunnel.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
TUNNEL_NAME="${TUNNEL_NAME:-vibe-music}"
ORIGIN_URL="${ORIGIN_URL:-http://127.0.0.1:3000}"

echo "==> Installing cloudflared (if missing)"
if ! command -v cloudflared >/dev/null 2>&1; then
  ARCH="$(dpkg --print-architecture 2>/dev/null || uname -m)"
  case "$ARCH" in
    amd64|x86_64) DEB_ARCH=amd64 ;;
    arm64|aarch64) DEB_ARCH=arm64 ;;
    *) echo "Unsupported arch: $ARCH" >&2; exit 1 ;;
  esac
  TMP="$(mktemp -d)"
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${DEB_ARCH}.deb" -o "$TMP/cloudflared.deb"
  dpkg -i "$TMP/cloudflared.deb"
  rm -rf "$TMP"
fi
cloudflared --version

install -d /etc/cloudflared
if [[ ! -f /etc/cloudflared/cert.pem ]]; then
  if [[ -f /root/.cloudflared/cert.pem ]]; then
    cp /root/.cloudflared/cert.pem /etc/cloudflared/cert.pem
  else
    echo ""
    echo "Run once (opens browser — paste URL if headless):" >&2
    echo "  cloudflared tunnel login" >&2
    echo "Then re-run: sudo bash deploy/cloudflare/setup-tunnel.sh" >&2
    exit 1
  fi
fi

echo "==> Creating tunnel: $TUNNEL_NAME"
if ! cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
  cloudflared tunnel create "$TUNNEL_NAME"
fi

TUNNEL_ID="$(cloudflared tunnel list 2>/dev/null | awk -v n="$TUNNEL_NAME" '$0 ~ n {print $1; exit}')"
if [[ -z "$TUNNEL_ID" ]]; then
  echo "Could not resolve tunnel id for $TUNNEL_NAME" >&2
  exit 1
fi

CRED_SRC="/root/.cloudflared/${TUNNEL_ID}.json"
CRED_DST="/etc/cloudflared/${TUNNEL_ID}.json"
if [[ -f "$CRED_SRC" ]]; then
  cp "$CRED_SRC" "$CRED_DST"
fi
if [[ ! -f "$CRED_DST" ]]; then
  echo "Missing credentials: $CRED_DST" >&2
  exit 1
fi

cat > /etc/cloudflared/config.yml <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: ${CRED_DST}

ingress:
  - hostname: vibemusic.in
    service: ${ORIGIN_URL}
  - hostname: www.vibemusic.in
    service: ${ORIGIN_URL}
  - hostname: cdn.vibemusic.in
    service: https://127.0.0.1:443
    originRequest:
      originServerName: cdn.vibemusic.in
  - service: http_status:404
EOF

echo "==> Routing DNS (Cloudflare zone must use Cloudflare nameservers)"
for host in vibemusic.in www.vibemusic.in cdn.vibemusic.in; do
  cloudflared tunnel route dns "$TUNNEL_NAME" "$host" || echo "    WARN: route dns failed for $host (zone not on CF yet?)" >&2
done

echo "==> Installing systemd service"
cloudflared service install 2>/dev/null || true
systemctl enable cloudflared
systemctl restart cloudflared
systemctl --no-pager status cloudflared | head -15

echo ""
echo "Tunnel active. After DNS propagates, public traffic bypasses 31.42.125.219 entirely."
echo "Verify: curl -sI https://vibemusic.in | head -5"
