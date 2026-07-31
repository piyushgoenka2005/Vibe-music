#!/usr/bin/env bash
# =============================================================================
# Vibe Music — go live on https://vibemusic.in
# Run on VPS as root (you are already SSH'd in):
#   cd /path/to/vibe-music && bash deploy/go-live.sh
# =============================================================================
set -euo pipefail

DOMAIN="vibemusic.in"
APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

log() { echo ""; echo ">>> $*"; }

log "App directory: $APP_DIR"

# --- Phase 1: prerequisites ---
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw

mkdir -p /var/www/certbot /var/log/vibe

# --- Phase 2: environment ---
ENV_FILE=".env.production"
[ -f .env.local ] && ENV_FILE=".env.local"
[ -f .env ] && [ ! -f .env.production ] && ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: No $ENV_FILE found. Create it with production secrets first."
  exit 1
fi

cp -a "$ENV_FILE" "${ENV_FILE}.bak.$(date +%s)"
log "Using env file: $ENV_FILE"

ensure_env() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

ensure_env "NODE_ENV" "production"
ensure_env "PORT" "3000"
ensure_env "HOSTNAME" "127.0.0.1"
ensure_env "NEXT_PUBLIC_SITE_URL" "https://${DOMAIN}"
ensure_env "ALLOW_DEMO_PAYMENTS" "false"

if ! grep -q "^ALLOW_DEMO_PAYMENTS=" "$ENV_FILE"; then
  echo "ALLOW_DEMO_PAYMENTS=false" >> "$ENV_FILE"
fi
# --- Phase 3: deploy application ---
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  log "Installing dependencies"
  npm ci

  log "Type-check"
  npm run type-check

  log "Building Next.js"
  export NODE_ENV=production
  npm run build
else
  log "Skipping build (SKIP_BUILD=1)"
fi

log "Starting PM2 (Next.js loads .env.production automatically)"
if [ "${SKIP_PM2:-0}" != "1" ]; then
  if pm2 describe vibe >/dev/null 2>&1; then
    pm2 delete vibe || true
  fi

  if [ -f deploy/ecosystem.config.cjs ]; then
    pm2 start deploy/ecosystem.config.cjs --update-env
  else
    NODE_ENV=production pm2 start npm --name vibe -- start
  fi
  pm2 save
else
  log "Skipping PM2 restart (SKIP_PM2=1)"
fi

pm2 startup systemd -u root --hp /root 2>/dev/null | grep -E '^sudo' | bash || true

sleep 4
LOCAL_CODE=$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo "000")
log "Node app health: HTTP $LOCAL_CODE on :3000"
if [ "$LOCAL_CODE" != "200" ]; then
  echo "WARNING: App did not return 200. Recent PM2 errors:"
  pm2 logs vibe --lines 30 --nostream || true
  echo "Continuing with Nginx/SSL setup..."
fi

# --- Phase 4: Nginx HTTP bootstrap ---
log "Configuring Nginx (HTTP bootstrap)"
NGINX_SITE="/etc/nginx/sites-available/${DOMAIN}"
cp -a "$NGINX_SITE" "${NGINX_SITE}.bak.$(date +%s)" 2>/dev/null || true
cp deploy/nginx/vibemusic.in.bootstrap.conf "$NGINX_SITE"
ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl enable nginx
systemctl reload nginx

# --- Phase 5: Firewall ---
log "Configuring UFW"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable || true

# --- Phase 6: Let's Encrypt SSL ---
log "Obtaining SSL certificate"
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  certbot certonly --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" -d "www.${DOMAIN}" \
    --non-interactive --agree-tos \
    --email "ops@${DOMAIN}" \
    --no-eff-email || {
      echo "Certbot failed. Trying nginx plugin..."
      certbot --nginx -d "$DOMAIN" -d "www.${DOMAIN}" \
        --non-interactive --agree-tos \
        --email "ops@${DOMAIN}" --no-eff-email
    }
fi

# --- Phase 7: Nginx HTTPS production config ---
log "Enabling HTTPS + security headers"
cp deploy/nginx/vibemusic.in.conf "$NGINX_SITE"
nginx -t
systemctl reload nginx

# Auto-renewal
systemctl enable certbot.timer 2>/dev/null || true
certbot renew --dry-run || true

# --- Phase 8: Validation ---
log "Validation"
sleep 2
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "http://${DOMAIN}/" || echo "000")
HTTPS_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "https://${DOMAIN}/" || echo "000")
HEALTH=$(curl -sS "https://${DOMAIN}/api/health" 2>/dev/null | head -c 200 || echo "unreachable")

echo ""
echo "=============================================="
echo "  Go-live results"
echo "=============================================="
echo "  http://${DOMAIN}  → HTTP $HTTP_CODE (should 301)"
echo "  https://${DOMAIN} → HTTP $HTTPS_CODE (should 200)"
echo "  /api/health       → $HEALTH"
echo "=============================================="
pm2 list

if [ "$HTTPS_CODE" = "200" ]; then
  echo "SUCCESS: https://${DOMAIN} is live."
else
  echo "ACTION NEEDED: HTTPS returned $HTTPS_CODE"
  echo "  pm2 logs vibe --lines 50"
  echo "  tail -50 /var/log/nginx/error.log"
fi
