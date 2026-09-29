#!/usr/bin/env bash
# Standard UFW for CloudOnFire VPS — SSH + nginx (80/443). Node stays on 127.0.0.1:3000.
#
# Usage:
#   sudo bash deploy/vps-firewall.sh
# Restrict SSH to your IP:
#   sudo ADMIN_SSH_IP=203.0.113.10 bash deploy/vps-firewall.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo bash deploy/vps-firewall.sh" >&2
  exit 1
fi

log() { echo "==> $*"; }

log "Configuring UFW (CloudOnFire VPS)"
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

ufw allow "Nginx Full"
ufw --force enable
ufw status numbered

log "Firewall active — ports 22, 80, 443 open; Node :3000 not exposed."
