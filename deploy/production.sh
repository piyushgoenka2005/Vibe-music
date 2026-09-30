#!/usr/bin/env bash
# Production edge: nginx, compliance, certification, rollback, SSL, deploy sync.
#
#   bash deploy/production.sh              # sync nginx (default)
#   bash deploy/production.sh compliance   # GSTIN + redeploy
#   bash deploy/production.sh certify        # full certification
#   bash deploy/production.sh rollback       # roll back to .deploy-previous.sha
#   bash deploy/production.sh ssl            # Let's Encrypt + nginx
#   bash deploy/production.sh verify-sync    # CI: live SHA vs expected
#   LOCKDOWN_UFW=1 bash deploy/production.sh certify
set -euo pipefail

SCRIPT="${BASH_SOURCE[0]}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "$SCRIPT")/.." && pwd)}"
cd "$APP_DIR"

die() { echo "ERROR: $*" >&2; exit 1; }

strip_legacy_edge_proxy() {
  rm -f /etc/nginx/conf.d/cloudflare-real-ip.conf 2>/dev/null || true
  rm -rf "${APP_DIR}/deploy/cloudflare" 2>/dev/null || true
  if command -v systemctl >/dev/null 2>&1; then
    systemctl disable --now cloudflared 2>/dev/null || true
  fi
  rm -rf /etc/cloudflared /root/.cloudflared 2>/dev/null || true
}

ensure_ops_secrets() {
  local SECRETS="deploy/ops-secrets.env"
  local EXAMPLE="deploy/ops-secrets.env.example"
  local DEFAULT_LEGAL="Sikkim Commerce House Pvt Ltd"
  if [[ ! -f "$SECRETS" ]]; then
    cp "$EXAMPLE" "$SECRETS"
    echo "Created $SECRETS from example."
  fi
  upsert() {
    local key="$1" value="$2"
    if grep -q "^${key}=" "$SECRETS" 2>/dev/null; then
      sed -i "s|^${key}=.*|${key}=${value}|" "$SECRETS"
    else
      echo "${key}=${value}" >> "$SECRETS"
    fi
  }
  if ! grep -qE '^NEXT_PUBLIC_LEGAL_ENTITY_NAME=.+[^[:space:]]' "$SECRETS" 2>/dev/null || \
     grep -q '^NEXT_PUBLIC_LEGAL_ENTITY_NAME=Vibe Music$' "$SECRETS" 2>/dev/null; then
    upsert "NEXT_PUBLIC_LEGAL_ENTITY_NAME" "$DEFAULT_LEGAL"
  fi
  if ! grep -qE '^METRICS_SCRAPE_TOKEN=.{16,}' "$SECRETS" 2>/dev/null; then
    local TOKEN
    TOKEN="$(openssl rand -hex 24 2>/dev/null || head -c 48 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 48)"
    upsert "METRICS_SCRAPE_TOKEN" "$TOKEN"
  fi
  if ! grep -qE '^TRUST_PROXY_HOPS=' "$SECRETS" 2>/dev/null; then
    upsert "TRUST_PROXY_HOPS" "1"
  fi
}

wait_for_ready() {
  local BASE_URL="${1:-http://127.0.0.1:3000}"
  BASE_URL="${BASE_URL%/}"
  local MAX_ATTEMPTS="${2:-25}"
  local SLEEP_SECS="${SLEEP_SECS:-3}"
  echo "==> Readiness gate ($BASE_URL, up to ${MAX_ATTEMPTS} attempts)"
  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    sleep "$SLEEP_SECS"
    local HEALTH_CODE READY_CODE
    HEALTH_CODE="$(curl -sS -o /tmp/vibe-health.json -w '%{http_code}' "${BASE_URL}/api/health" 2>/dev/null || echo 000)"
    READY_CODE="$(curl -sS -o /tmp/vibe-ready.json -w '%{http_code}' "${BASE_URL}/api/readyz" 2>/dev/null || echo 000)"
    if [[ "$HEALTH_CODE" == "200" && "$READY_CODE" == "200" ]]; then
      echo "    attempt $attempt: /api/health → 200, /api/readyz → 200"
      return 0
    fi
    echo "    attempt $attempt: health=$HEALTH_CODE ready=$READY_CODE (waiting…)"
  done
  die "readiness gate failed after $MAX_ATTEMPTS attempts"
}

configure_vps_firewall() {
  if [[ "$(id -u)" -ne 0 ]]; then
    die "firewall requires root: sudo bash deploy/production.sh firewall"
  fi
  echo "==> Configuring UFW"
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  if [[ -n "${ADMIN_SSH_IP:-}" ]]; then
    ufw allow from "$ADMIN_SSH_IP" to any port 22 proto tcp
  else
    ufw allow OpenSSH
  fi
  ufw allow "Nginx Full"
  ufw --force enable
  ufw status numbered
}

extract_nginx() {
  local name="$1"
  sed -n "/^# --- NGINX:${name}:START ---$/,/^# --- NGINX:${name}:END ---$/p" "$SCRIPT" | sed '1d;$d'
}

write_nginx_site() {
  local name="$1"
  local dest="/etc/nginx/sites-available/${name}"
  extract_nginx "$name" > "$dest"
  ln -sf "$dest" "/etc/nginx/sites-enabled/${name}"
  echo "  -> $name"
}

sync_nginx() {
  if ! command -v nginx >/dev/null 2>&1; then
    echo "nginx not installed — skipping sync"
    return 0
  fi
  local CDN_ROOT="${CDN_STORAGE_ROOT:-/var/www/cdn}"
  mkdir -p "$CDN_ROOT/products" "$CDN_ROOT/banners" "$CDN_ROOT/blog" "$CDN_ROOT/reviews"
  chmod -R u+rwX,g+rwX "$CDN_ROOT" 2>/dev/null || true
  install -d /etc/nginx/sites-available /etc/nginx/sites-enabled
  ALLOWED_SITES=(vibemusic.in cdn.vibemusic.in mail.vibemusic.in)
  for link in /etc/nginx/sites-enabled/*; do
    [[ -e "$link" ]] || continue
    local base="$(basename "$link")" keep=0 allowed
    for allowed in "${ALLOWED_SITES[@]}"; do
      [[ "$base" == "$allowed" ]] && keep=1 && break
    done
    if [[ "$keep" -eq 0 ]]; then
      echo "  x disabling rogue nginx site: $base"
      rm -f "$link"
    fi
  done
  if [[ "${NGINX_BOOTSTRAP:-0}" == "1" ]]; then
    write_nginx_site vibemusic.in.bootstrap
    mv "/etc/nginx/sites-available/vibemusic.in.bootstrap" "/etc/nginx/sites-available/vibemusic.in"
    ln -sf "/etc/nginx/sites-available/vibemusic.in" "/etc/nginx/sites-enabled/vibemusic.in"
    write_nginx_site cdn.vibemusic.in
    write_nginx_site mail.vibemusic.in
  else
    for site in "${ALLOWED_SITES[@]}"; do write_nginx_site "$site"; done
  fi
  strip_legacy_edge_proxy
  if ! grep -rqsE '^\s*server_names_hash_bucket_size' /etc/nginx/nginx.conf /etc/nginx/conf.d/ 2>/dev/null; then
    echo 'server_names_hash_bucket_size 128;' > /etc/nginx/conf.d/00-hash.conf
  fi
  mkdir -p /var/cache/nginx/vibe-pages /var/cache/nginx/vibe-images
  chown -R www-data:www-data /var/cache/nginx/vibe-pages /var/cache/nginx/vibe-images 2>/dev/null || true
  nginx -t
  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload-or-restart nginx 2>/dev/null || true
  else
    nginx -s reload 2>/dev/null || true
  fi
  echo "nginx synced and reloaded (CDN root: $CDN_ROOT)"
}

sync_ssl() {
  sync_nginx
  if command -v certbot >/dev/null 2>&1; then
    certbot certonly --nginx \
      -d vibemusic.in -d www.vibemusic.in -d mail.vibemusic.in \
      --expand --non-interactive --agree-tos --keep-until-expiring \
      || certbot certonly --nginx \
      -d vibemusic.in -d www.vibemusic.in -d mail.vibemusic.in \
      --expand --non-interactive --agree-tos
  else
    echo "WARN: certbot not installed" >&2
  fi
  nginx -t
  systemctl reload-or-restart nginx 2>/dev/null || true
  echo "SSL sync complete."
}

apply_compliance() {
  local SECRETS_FILE="deploy/ops-secrets.env"
  local EXAMPLE="deploy/ops-secrets.env.example"
  [[ -f "$SECRETS_FILE" ]] || cp "$EXAMPLE" "$SECRETS_FILE"
  ensure_ops_secrets
  local GSTIN="${NEXT_PUBLIC_GSTIN:-}"
  local LEGAL="${NEXT_PUBLIC_LEGAL_ENTITY_NAME:-Sikkim Commerce House Pvt Ltd}"
  if [[ -z "$GSTIN" ]] && grep -qE '^NEXT_PUBLIC_GSTIN=.{15}' "$SECRETS_FILE" 2>/dev/null; then
    GSTIN="$(grep '^NEXT_PUBLIC_GSTIN=' "$SECRETS_FILE" | cut -d= -f2-)"
  fi
  if [[ -z "$GSTIN" ]] && [[ -f .env ]] && grep -qE '^NEXT_PUBLIC_GSTIN=.{15}' .env 2>/dev/null; then
    GSTIN="$(grep '^NEXT_PUBLIC_GSTIN=' .env | cut -d= -f2- | tr -d '"' | tr -d "'")"
  fi
  if [[ -z "$GSTIN" ]] && [[ -f .env ]]; then
    GSTIN="$(npx tsx --env-file=.env scripts/ops/read-store-gstin.mts 2>/dev/null || true)"
  fi
  [[ -n "$GSTIN" ]] || read -r -p "GSTIN (15 characters): " GSTIN
  [[ -n "$LEGAL" ]] || read -r -p "Legal entity name: " LEGAL
  LEGAL="${LEGAL:-Sikkim Commerce House Pvt Ltd}"
  [[ "$GSTIN" =~ ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$ ]] || die "invalid GSTIN format"
  upsert_secret() {
    local key="$1" value="$2"
    if grep -q "^${key}=" "$SECRETS_FILE"; then
      sed -i "s|^${key}=.*|${key}=${value}|" "$SECRETS_FILE"
    else
      echo "${key}=${value}" >> "$SECRETS_FILE"
    fi
  }
  upsert_secret "NEXT_PUBLIC_GSTIN" "$GSTIN"
  upsert_secret "NEXT_PUBLIC_LEGAL_ENTITY_NAME" "$LEGAL"
  MERGE_OVERWRITE_KEYS="NEXT_PUBLIC_GSTIN,NEXT_PUBLIC_LEGAL_ENTITY_NAME" node scripts/ops/merge-ops-secrets.mjs
  node scripts/ops/normalize-production-env.mjs
  npx tsx --env-file=.env scripts/ops/seed-production-ops.mts || true
  SKIP_PULL=1 bash deploy/update.sh
  VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" npm run verify:phase9
  REQUIRE_COMPLIANCE=true VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" npm run verify:prod-signoff
}

audit_go_live() {
  node scripts/ops/normalize-production-env.mjs
  node scripts/ops/merge-ops-secrets.mjs
  grep -q '^TRUST_PROXY_HOPS=' .env 2>/dev/null || echo 'TRUST_PROXY_HOPS=1' >> .env
  npx tsx --env-file=.env scripts/ops/seed-production-ops.mts || true
  [[ "${LOCKDOWN_UFW:-0}" == "1" ]] && configure_vps_firewall
  VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" npm run check:edge || echo "WARN: check:edge failed" >&2
  VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}" npm run verify:prod-signoff
}

certify_production() {
  echo "==> Production certification (20/20 target)"
  ensure_ops_secrets
  node scripts/ops/merge-ops-secrets.mjs || true
  apply_compliance
  audit_go_live
  npm run verify:readiness || true
}

rollback_production() {
  local TARGET="${1:-}"
  [[ -n "$TARGET" ]] || TARGET="$(cat .deploy-previous.sha 2>/dev/null || true)"
  [[ -n "$TARGET" ]] || die "no .deploy-previous.sha — pass a git SHA"
  local CURRENT
  CURRENT="$(git rev-parse HEAD)"
  [[ "$TARGET" != "$CURRENT" ]] || { echo "Already at $CURRENT"; exit 0; }
  git fetch origin main || true
  git checkout -q --detach "$TARGET"
  npm ci
  rm -rf .next
  NODE_ENV=production ALLOW_POSTGRES_DURING_BUILD="${ALLOW_POSTGRES_DURING_BUILD:-true}" npm run build
  pm2 restart vibe --update-env 2>/dev/null || pm2 start deploy/ecosystem.config.cjs --update-env
  pm2 save
  wait_for_ready "http://127.0.0.1:3000" 20
  echo "Rollback complete at $(git rev-parse --short HEAD)"
}

verify_deploy_sync() {
  local VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}"
  VERIFY_BASE_URL="${VERIFY_BASE_URL%/}"
  local EXPECTED_SHA="${EXPECTED_SHA:-$(git rev-parse HEAD)}"
  local EXPECTED_SHORT="${EXPECTED_SHA:0:7}"
  local BODY LIVE_VERSION
  BODY="$(curl -fsS --max-time 30 "${VERIFY_BASE_URL}/api/health" || echo "")"
  [[ -n "$BODY" ]] || die "could not reach ${VERIFY_BASE_URL}/api/health"
  LIVE_VERSION="$(echo "$BODY" | node -e "
    let d; try { d = JSON.parse(require('fs').readFileSync(0,'utf8')); } catch { process.exit(2); }
    process.stdout.write(String(d.version ?? '').trim());
  " 2>/dev/null || true)"
  [[ -n "$LIVE_VERSION" ]] || die "/api/health missing version"
  if [[ "$LIVE_VERSION" == "$EXPECTED_SHA" || "$LIVE_VERSION" == "$EXPECTED_SHORT" || "$EXPECTED_SHA" == "$LIVE_VERSION"* ]]; then
    echo "PASS — live ${LIVE_VERSION} matches ${EXPECTED_SHORT}"
    exit 0
  fi
  die "live mismatch (expected ${EXPECTED_SHORT}, got ${LIVE_VERSION})"
}

usage() {
  cat <<USAGE
Usage: bash deploy/production.sh [command]

  nginx        Sync nginx vhosts (default)
  compliance   GSTIN + legal entity + redeploy
  certify      Full production certification
  rollback     Roll back to .deploy-previous.sha or given SHA
  ssl          Sync nginx + expand Let's Encrypt certs
  verify-sync  Compare live /api/health version to EXPECTED_SHA
  firewall     Configure UFW (requires root)
USAGE
  exit 1
}

cmd="${1:-nginx}"
case "$cmd" in
  nginx|sync) sync_nginx ;;
  compliance|apply-compliance) apply_compliance ;;
  certify|certify-production) certify_production ;;
  rollback) rollback_production "${2:-}" ;;
  ssl) sync_ssl ;;
  verify-sync) verify_deploy_sync ;;
  firewall) configure_vps_firewall ;;
  -h|--help|help) usage ;;
  *) die "unknown command: $cmd" ;;
esac

# --- NGINX:vibemusic.in:START ---
# ─── Nginx reverse proxy for Vibe Music ───────────────────────────────────
# Optimized for 2000+ concurrent real-time users via PM2 cluster on port 3000.
#
# Architecture:
#   Browser → Nginx (SSL + cache + rate limit) → PM2 cluster (port 3000) → PostgreSQL
#
# PM2 cluster mode: all workers share port 3000. Nginx sends to the single
# upstream; PM2's cluster module round-robins across workers internally.
#
# For 2K concurrent users:
#   - Nginx proxy_cache serves ~70% of page requests from disk (0ms latency)
#   - Nginx rate limiting prevents thundering herds
#   - PM2 cluster (4 cores × 20 DB conns = 80 connections)
#   - Keepalive pool of 128 persistent connections to Node.js
# ──────────────────────────────────────────────────────────────────────────

# ─── Proxy cache zone for SSR pages ──────────────────────────────────────
# 64MB key zone (~500K unique keys), 512MB disk cache, 10min inactive purge.
# Pages served from cache hit disk in <1ms vs 200-500ms from Node.js.
proxy_cache_path /var/cache/nginx/vibe-pages
    levels=1:2
    keys_zone=vibe_pages:64m
    max_size=512m
    inactive=10m
    use_temp_path=off;

# ─── Proxy cache zone for Next.js optimized images ──────────────────────
# 64MB key zone, 1GB disk cache, 30-day inactive purge.
proxy_cache_path /var/cache/nginx/vibe-images
    levels=1:2
    keys_zone=vibe_images:64m
    max_size=1024m
    inactive=30d
    use_temp_path=off;

# Rate limiting zones (shared across all server blocks)
limit_req_zone $binary_remote_addr zone=api_limit:20m rate=60r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:20m rate=10r/s;
limit_req_zone $binary_remote_addr zone=search_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=page_limit:20m rate=120r/s;

# Connection limiting — prevent a single IP from exhausting the upstream
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

upstream vibe_nextjs {
    server 127.0.0.1:3000;

    # Keepalive: persistent connections to Node.js reduce TCP handshake overhead.
    # 128 is sized for PM2 cluster (4 cores × 32 conns each).
    keepalive 128;

    # Keepalive connections reduce latency from ~5ms (handshake) to ~0.5ms
    keepalive_timeout 60s;
    keepalive_requests 1000;
}

# ─── HTTP → HTTPS redirect ────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name vibemusic.in www.vibemusic.in;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# ─── Main HTTPS server (default SSL vhost — avoids wrong cert on unknown SNI) ─
server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name vibemusic.in www.vibemusic.in;

    # ── SSL ──────────────────────────────────────────────────────────────
    ssl_certificate     /etc/letsencrypt/live/vibemusic.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vibemusic.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ── Upload limits ────────────────────────────────────────────────────
    client_max_body_size 25m;

    # ── Client timeout: how long Nginx waits for client to send data ─────
    client_body_timeout 30s;
    client_header_timeout 15s;
    send_timeout 30s;

    # ── Connection limit per IP ──────────────────────────────────────────
    # Real browsers use 6 concurrent connections per domain.
    # 50 per IP gives headroom for mobile + desktop simultaneously.
    limit_conn conn_limit 50;

    # ── Security headers ─────────────────────────────────────────────────
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    # CSP is set ONLY by Next.js (src/lib/security/headers.ts via next.config.ts).
    # Do NOT add Content-Security-Policy here — duplicate policies block Razorpay
    # checkout (form-action 'self' from an older nginx CSP + app CSP = infinite modal load).

    # ── Compression ──────────────────────────────────────────────────────
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml image/svg+xml;

    # ── Global proxy defaults (inherited by all proxy_pass locations) ─────
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";

    # Socket keepalive: reduces TCP teardown on fast responses
    proxy_socket_keepalive on;

    # ── Buffer tuning ────────────────────────────────────────────────────
    # Large busy_buffers absorb traffic bursts without writing to disk.
    proxy_buffer_size 16k;
    proxy_buffers 8 32k;
    proxy_busy_buffers_size 64k;

    # ════════════════════════════════════════════════════════════════════════
    # STATIC ASSETS — fast paths, no rate limiting, long cache
    # ════════════════════════════════════════════════════════════════════════

    location /_next/static/ {
        proxy_pass http://vibe_nextjs;

        # Static assets are fingerprinted — 1 year immutable cache
        add_header Cache-Control "public, max-age=31536000, immutable";

        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
        proxy_send_timeout 5s;
        proxy_next_upstream off;
    }

    # Next.js Image Optimizer — disk-cached, long lifetime, stale fallback
    location /_next/image {
        limit_req zone=page_limit burst=80 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;

        # Dedicated long-lived disk cache for optimized images
        proxy_cache vibe_images;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_cache_valid 200 30d;
        proxy_cache_valid 404 1m;

        # Serve stale cache during temporary upstream failures or background revalidations
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;

        # Upstream cookies must not prevent image caching
        proxy_ignore_headers Set-Cookie;

        add_header X-Cache-Status $upstream_cache_status always;
        add_header Cache-Control "public, max-age=2592000, stale-while-revalidate=86400" always;

        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
        proxy_send_timeout 15s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 15s;
    }

    location /images/ {
        proxy_pass http://vibe_nextjs;
        add_header Cache-Control "public, max-age=86400";

        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
        proxy_send_timeout 10s;
        proxy_next_upstream off;
    }

    location /videos/ {
        proxy_pass http://vibe_nextjs;
        add_header Cache-Control "public, max-age=86400";

        # Video range requests need generous read timeout
        proxy_connect_timeout 5s;
        proxy_read_timeout 120s;
        proxy_send_timeout 30s;
        proxy_next_upstream off;
    }

    # ════════════════════════════════════════════════════════════════════════
    # SSR PAGE CACHE — serve cached HTML from disk, bypass Node.js entirely
    # This is the #1 performance win for 2K concurrent users.
    # Homepage: 60s cache, Category: 60s cache, Product: 120s cache.
    # ════════════════════════════════════════════════════════════════════════

    # Homepage — highest traffic, cache 60s
    location = / {
        limit_req zone=page_limit burst=80 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;

        # Proxy cache: serve from disk if fresh, serve stale while revalidating
        proxy_cache vibe_pages;
        proxy_cache_valid 200 60s;
        proxy_cache_valid 404 10s;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;

        # Bypass cache for logged-in users (cookie-based)
        proxy_cache_bypass $cookie_vibe_session;
        proxy_no_cache $cookie_vibe_session;

        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=0, s-maxage=60, stale-while-revalidate=86400" always;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_send_timeout 30s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 20s;
    }

    # Category pages — cache 60s
    location ~ ^/category/[^/]+/?$ {
        limit_req zone=page_limit burst=60 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;

        proxy_cache vibe_pages;
        proxy_cache_valid 200 60s;
        proxy_cache_valid 404 10s;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;

        proxy_cache_bypass $cookie_vibe_session;
        proxy_no_cache $cookie_vibe_session;

        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=0, s-maxage=60, stale-while-revalidate=86400" always;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_send_timeout 30s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 20s;
    }

    # Product pages — cache 120s (less volatile than homepage)
    location ~ ^/product/[^/]+/?$ {
        limit_req zone=page_limit burst=60 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;

        proxy_cache vibe_pages;
        proxy_cache_valid 200 120s;
        proxy_cache_valid 404 10s;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;

        proxy_cache_bypass $cookie_vibe_session;
        proxy_no_cache $cookie_vibe_session;

        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=0, s-maxage=60, stale-while-revalidate=86400" always;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_send_timeout 30s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 20s;
    }

    # Brand pages — cache 60s
    location ~ ^/brand/[^/]+/?$ {
        limit_req zone=page_limit burst=60 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;

        proxy_cache vibe_pages;
        proxy_cache_valid 200 60s;
        proxy_cache_valid 404 10s;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;

        proxy_cache_bypass $cookie_vibe_session;
        proxy_no_cache $cookie_vibe_session;

        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=0, s-maxage=60, stale-while-revalidate=86400" always;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_send_timeout 30s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 20s;
    }

    # Deals page — cache 60s (serves stale HTML during PM2 restarts)
    location = /deals {
        limit_req zone=page_limit burst=60 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;

        proxy_cache vibe_pages;
        proxy_cache_valid 200 60s;
        proxy_cache_valid 404 10s;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;

        proxy_cache_bypass $cookie_vibe_session;
        proxy_no_cache $cookie_vibe_session;

        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=0, s-maxage=60, stale-while-revalidate=86400" always;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_send_timeout 30s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 20s;
    }

    # Blog listing and post pages — cache 120s
    location ~ ^/blog(/[^/]+)?/?$ {
        limit_req zone=page_limit burst=40 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;

        proxy_cache vibe_pages;
        proxy_cache_valid 200 120s;
        proxy_cache_valid 404 30s;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
        proxy_cache_lock_timeout 5s;

        add_header X-Cache-Status $upstream_cache_status;

        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
        proxy_send_timeout 15s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 15s;
    }

    # Static CMS pages — cache 300s (rarely change)
    location ~ ^/pages/[^/]+/?$ {
        proxy_pass http://vibe_nextjs;

        proxy_cache vibe_pages;
        proxy_cache_valid 200 300s;
        proxy_cache_valid 404 60s;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503;

        add_header X-Cache-Status $upstream_cache_status;

        proxy_connect_timeout 5s;
        proxy_read_timeout 15s;
        proxy_send_timeout 10s;
        proxy_next_upstream off;
    }

    # ════════════════════════════════════════════════════════════════════════
    # API ROUTES — rate limited, with failover, NEVER cached
    # ════════════════════════════════════════════════════════════════════════

    # Auth endpoints: strict rate limit
    location /api/auth/ {
        limit_req zone=auth_limit burst=20 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;
        proxy_cache off;

        proxy_connect_timeout 5s;
        proxy_read_timeout 15s;
        proxy_send_timeout 10s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 10s;
    }

    # Admin endpoints: generous timeout (bulk operations)
    location /api/admin/ {
        limit_req zone=api_limit burst=40 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;
        proxy_cache off;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_send_timeout 30s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 15s;
    }

    # Search endpoints: separate rate limit
    location /api/search {
        limit_req zone=search_limit burst=30 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;
        proxy_cache off;

        proxy_connect_timeout 5s;
        proxy_read_timeout 15s;
        proxy_send_timeout 10s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 10s;
    }

    # All other API routes: generous burst, fast failover
    location /api/ {
        limit_req zone=api_limit burst=100 nodelay;
        limit_req_status 429;

        proxy_pass http://vibe_nextjs;
        proxy_cache off;

        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
        proxy_send_timeout 15s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 15s;
    }

    # ════════════════════════════════════════════════════════════════════════
    # CATCH-ALL PAGES — un-cached pages (login, cart, checkout, account)
    # ════════════════════════════════════════════════════════════════════════

    location / {
        proxy_pass http://vibe_nextjs;
        proxy_cache off;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_send_timeout 30s;

        proxy_next_upstream error timeout http_502 http_503;
        proxy_next_upstream_tries 2;
        proxy_next_upstream_timeout 20s;
    }
}
# --- NGINX:vibemusic.in:END ---

# --- NGINX:cdn.vibemusic.in:START ---
# Nginx static host for cdn.vibemusic.in
# Install:
#   sudo mkdir -p /var/www/cdn
#   sudo cp deploy/nginx/cdn.vibemusic.in.conf /etc/nginx/sites-available/cdn.vibemusic.in
#   sudo ln -sf /etc/nginx/sites-available/cdn.vibemusic.in /etc/nginx/sites-enabled/
#   sudo certbot --nginx -d cdn.vibemusic.in
#   sudo nginx -t && sudo systemctl reload nginx

server {
    listen 80;
    listen [::]:80;
    server_name cdn.vibemusic.in;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cdn.vibemusic.in;

    ssl_certificate     /etc/letsencrypt/live/cdn.vibemusic.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cdn.vibemusic.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/cdn;
    autoindex off;

    # Derivative fallback: if a specific width (e.g. -w320.webp, -w800.webp) is requested
    # but not present on disk, gracefully fall back to -w480.webp, -w960.webp, or master
    location ~* ^(?<base>.+)-w\d+\.webp$ {
        try_files $uri ${base}-w480.webp ${base}-w960.webp ${base}.webp ${base}.png =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin "*";
    }

    location / {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
}
# --- NGINX:cdn.vibemusic.in:END ---

# --- NGINX:mail.vibemusic.in:START ---
# mail.vibemusic.in — DNS points here; serve valid cert and redirect to storefront.
# Uses the vibemusic.in certificate (must include mail.vibemusic.in SAN via certbot --expand).

server {
    listen 80;
    listen [::]:80;
    server_name mail.vibemusic.in;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://vibemusic.in$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mail.vibemusic.in;

    ssl_certificate     /etc/letsencrypt/live/vibemusic.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vibemusic.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://vibemusic.in$request_uri;
}
# --- NGINX:mail.vibemusic.in:END ---

# --- NGINX:vibemusic.in.bootstrap:START ---
# HTTP-only bootstrap — use BEFORE Let's Encrypt certs exist.
# First-time cert bootstrap: NGINX_BOOTSTRAP=1 bash deploy/production.sh nginx, then fix-ssl-certificates.sh

upstream vibe_nextjs {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name vibemusic.in www.vibemusic.in;

    client_max_body_size 25m;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    location / {
        proxy_pass http://vibe_nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_read_timeout 120s;
    }
}
# --- NGINX:vibemusic.in.bootstrap:END ---
