#!/usr/bin/env bash
# Repair nginx TLS for vibemusic.in on VPS 1055.
#
# Fixes local nginx/certbot issues. Cannot fix CloudOnFire duplicate-IP routing
# (when ${VPS_IP} serves git.k12hunar.com to external clients) — that requires
# a CloudOnFire support ticket (docs/ops/cloudonfire-duplicate-ip-ticket.txt).
#
# Usage (on VPS as root):
#   bash deploy/fix-ssl-certificates.sh
#   bash deploy/fix-ssl-certificates.sh --check-only
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

VPS_IP="${VPS_IP:-31.42.125.219}"
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-vibemusic.in}"
CERT_DIR="/etc/letsencrypt/live/${PRIMARY_DOMAIN}"
CHECK_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --check-only) CHECK_ONLY=1 ;;
    -h|--help)
      echo "Usage: bash deploy/fix-ssl-certificates.sh [--check-only]"
      exit 0
      ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

log()  { echo "==> $*"; }
warn() { echo "    WARN: $*" >&2; }
die()  { echo "ERROR: $*" >&2; exit 1; }

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    die "run as root: sudo bash deploy/fix-ssl-certificates.sh"
  fi
}

verify_local_cert_files() {
  log "Checking Let's Encrypt files under ${CERT_DIR}"
  [[ -f "${CERT_DIR}/fullchain.pem" ]] || die "missing ${CERT_DIR}/fullchain.pem — run certbot"
  [[ -f "${CERT_DIR}/privkey.pem" ]] || die "missing ${CERT_DIR}/privkey.pem"

  local cn not_after
  cn="$(openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -subject 2>/dev/null | sed -n 's/.*CN=\([^,/]*\).*/\1/p')"
  not_after="$(openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -enddate 2>/dev/null | cut -d= -f2-)"

  log "  CN=${cn:-unknown} expires=${not_after:-unknown}"
  openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -text 2>/dev/null \
    | grep -A1 "Subject Alternative Name" || true

  if [[ "${cn}" != "${PRIMARY_DOMAIN}" ]]; then
    die "local cert CN=${cn} expected ${PRIMARY_DOMAIN}"
  fi

  if ! openssl x509 -in "${CERT_DIR}/fullchain.pem" -noout -text 2>/dev/null \
    | grep -q "DNS:${PRIMARY_DOMAIN}"; then
    die "local cert missing SAN DNS:${PRIMARY_DOMAIN}"
  fi
}

verify_loopback_tls() {
  log "Loopback TLS via nginx (127.0.0.1 + SNI ${PRIMARY_DOMAIN})"
  local out cn
  out="$(echo | openssl s_client -connect 127.0.0.1:443 -servername "${PRIMARY_DOMAIN}" 2>/dev/null \
    | openssl x509 -noout -subject 2>/dev/null || true)"
  cn="$(echo "$out" | sed -n 's/.*CN=\([^,/]*\).*/\1/p')"
  if [[ "${cn}" != "${PRIMARY_DOMAIN}" ]]; then
    die "nginx loopback presents CN=${cn:-none}, expected ${PRIMARY_DOMAIN}"
  fi
  log "  loopback CN=${cn} OK"
}

disable_rogue_nginx_sites() {
  log "Disabling rogue nginx sites (keep vibemusic.in / cdn / mail only)"
  bash deploy/production.sh nginx
}

renew_or_expand_certs() {
  if ! command -v certbot >/dev/null 2>&1; then
    warn "certbot not installed — skipping renewal"
    return 0
  fi

  log "Ensuring certbot covers vibemusic.in + www + mail"
  certbot certonly --nginx \
    -d vibemusic.in -d www.vibemusic.in -d mail.vibemusic.in \
    --expand --non-interactive --agree-tos --keep-until-expiring \
    || certbot certonly --nginx \
    -d vibemusic.in -d www.vibemusic.in -d mail.vibemusic.in \
    --expand --non-interactive --agree-tos

  if command -v certbot >/dev/null 2>&1; then
    log "CDN subdomain certificate (cdn.vibemusic.in)"
    certbot certonly --nginx -d cdn.vibemusic.in \
      --non-interactive --agree-tos --keep-until-expiring \
      || certbot certonly --nginx -d cdn.vibemusic.in --non-interactive --agree-tos \
      || warn "cdn.vibemusic.in certbot failed — check DNS"
  fi
}

reload_nginx() {
  log "Reloading nginx"
  nginx -t
  systemctl reload-or-restart nginx 2>/dev/null || nginx -s reload
}

check_public_routing_hint() {
  log "External duplicate-IP diagnostic (best-effort from VPS)"
  local body
  body="$(curl -sk --max-time 10 -H "Host: ${PRIMARY_DOMAIN}" "https://${VPS_IP}/api/health" 2>/dev/null || true)"
  if echo "$body" | grep -qiE 'i_like_gitea|/user/login'; then
    warn "Hit Gitea/Forgejo on ${VPS_IP} — CloudOnFire duplicate IP is ACTIVE"
    warn "See docs/ops/cloudonfire-duplicate-ip-ticket.txt"
    return 1
  fi
  if echo "$body" | grep -q '"status"'; then
    log "  ${VPS_IP} returned Vibe /api/health JSON (good sign for this probe)"
    return 0
  fi
  warn "Could not classify response from ${VPS_IP} — run npm run verify:ssl from your PC"
  return 0
}

require_root

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  verify_local_cert_files
  verify_loopback_tls
  check_public_routing_hint || true
  log "Check-only complete."
  exit 0
fi

verify_local_cert_files || true
disable_rogue_nginx_sites
renew_or_expand_certs
disable_rogue_nginx_sites
reload_nginx
verify_local_cert_files
verify_loopback_tls
check_public_routing_hint || true

log "Local SSL repair complete."
log "Run from your dev machine: VERIFY_BASE_URL=https://vibemusic.in npm run verify:ssl"
