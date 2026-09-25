#!/usr/bin/env bash
# Restrict origin HTTP/HTTPS to Cloudflare IP ranges only (L-23).
#
# Run on the VPS AFTER Cloudflare orange-cloud DNS is active and verified:
#   VERIFY_BASE_URL=https://vibemusic.in npm run check:edge   # must show cf-ray
#   sudo bash deploy/cloudflare-ufw.sh
#
# Optional: ADMIN_SSH_IP=your.home.ip bash deploy/cloudflare-ufw.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo bash deploy/cloudflare-ufw.sh" >&2
  exit 1
fi

log() { echo "==> $*"; }

log "Fetching current Cloudflare IP ranges"
TMP_V4="$(mktemp)"
TMP_V6="$(mktemp)"
curl -fsSL https://www.cloudflare.com/ips-v4 -o "$TMP_V4"
curl -fsSL https://www.cloudflare.com/ips-v6 -o "$TMP_V6"

log "Resetting UFW (deny incoming by default)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

if [ -n "${ADMIN_SSH_IP:-}" ]; then
  log "Allowing SSH from ADMIN_SSH_IP=$ADMIN_SSH_IP"
  ufw allow from "$ADMIN_SSH_IP" to any port 22 proto tcp
else
  log "Allowing SSH from anywhere (set ADMIN_SSH_IP to restrict)"
  ufw allow OpenSSH
fi

while read -r cidr; do
  [ -z "$cidr" ] && continue
  ufw allow from "$cidr" to any port 80 proto tcp
  ufw allow from "$cidr" to any port 443 proto tcp
done < "$TMP_V4"

while read -r cidr; do
  [ -z "$cidr" ] && continue
  ufw allow from "$cidr" to any port 80 proto tcp
  ufw allow from "$cidr" to any port 443 proto tcp
done < "$TMP_V6"

rm -f "$TMP_V4" "$TMP_V6"

ufw --force enable
ufw status numbered

log "Origin firewall locked to Cloudflare IPs (ports 80/443)."
log "Re-test: VERIFY_BASE_URL=https://vibemusic.in npm run check:edge"
