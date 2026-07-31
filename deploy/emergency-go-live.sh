#!/usr/bin/env bash
# Full production fix for vibemusic.in — run on VPS as root.
set -euo pipefail

DOMAIN="vibemusic.in"
APP_DIR="${APP_DIR:-$(find /root /var/www /home -maxdepth 5 -name package.json 2>/dev/null | while read f; do
  grep -q '"name": "vibe"' "$f" 2>/dev/null && dirname "$f" && break
done | head -1)}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
if [[ ! -d "$APP_DIR/.git" ]]; then
  for d in /root/Vibe-music /root/vibe-music /var/www/Vibe-music /home/ubuntu/Vibe-music; do
    [[ -d "$d/.git" ]] && APP_DIR="$d" && break
  done
fi
cd "$APP_DIR"
echo ">>> APP_DIR=$APP_DIR"

export DEBIAN_FRONTEND=noninteractive

# --- System packages ---
apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw build-essential

# --- Node.js 20 LTS if missing ---
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
command -v pm2 >/dev/null 2>&1 || npm install -g pm2
echo ">>> node $(node -v) npm $(npm -v) pm2 $(pm2 -v)"

mkdir -p /var/www/certbot /var/log/vibe

# --- Env file ---
ENV_FILE=""
for EF in .env.production .env.local .env; do
  [ -f "$EF" ] && ENV_FILE="$EF" && break
done
[ -z "$ENV_FILE" ] && { echo "ERROR: Create .env.production with Firebase + site secrets first."; exit 1; }
cp -a "$ENV_FILE" "${ENV_FILE}.bak.$(date +%s)"
echo ">>> Using $ENV_FILE"

set_env() {
  local k="$1" v="$2"
  if grep -q "^${k}=" "$ENV_FILE"; then sed -i "s|^${k}=.*|${k}=${v}|" "$ENV_FILE"
  else echo "${k}=${v}" >> "$ENV_FILE"; fi
}
set_env NODE_ENV production
set_env PORT 3000
set_env HOSTNAME 127.0.0.1
set_env NEXT_PUBLIC_SITE_URL "https://${DOMAIN}"
set_env FIRESTORE_STARTUP_DEADLINE_MS 15000
grep -q '^SKIP_INSTRUMENTATION_CHECKS=' "$ENV_FILE" || echo 'SKIP_INSTRUMENTATION_CHECKS=true' >> "$ENV_FILE"

# --- Source patch (old deployments crash on Firestore FAST_FAIL) ---
INSTR="src/instrumentation.ts"
if [ -f "$INSTR" ] && grep -q 'Firestore initialization failed' "$INSTR"; then
  cp -a "$INSTR" "${INSTR}.bak.$(date +%s)"
  python3 <<'PY'
from pathlib import Path
p = Path("src/instrumentation.ts")
t = p.read_text()
old = '''      if (!firestoreHealth.ok && process.env.NODE_ENV === "production") {
        throw new Error(
          `Firestore initialization failed: ${firestoreHealth.error ?? "unknown"}`
        );
      }'''
new = '''      if (!firestoreHealth.ok) {
        const { markFirestoreUnavailable } = await import("@/lib/server/firestoreErrors");
        markFirestoreUnavailable(new Error(firestoreHealth.error ?? "Firestore unavailable"));
      }'''
if old in t:
    p.write_text(t.replace(old, new))
    print("Patched instrumentation.ts")
PY
fi

# --- Restore media assets if git repo ---
if [ -d .git ]; then
  git checkout HEAD -- public/images public/videos 2>/dev/null || true
fi

# --- Install ALL deps (devDependencies required for next build) ---
echo ">>> npm ci (full install for build)"
npm ci
echo ">>> npm run build"
NODE_ENV=production npm run build

# --- PM2 ---
pm2 delete vibe 2>/dev/null || true
if [ -f deploy/ecosystem.config.cjs ]; then
  pm2 start deploy/ecosystem.config.cjs --update-env
else
  NODE_ENV=production pm2 start npm --name vibe -- start
fi
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | grep '^sudo' | bash || true

sleep 5
APP_CODE=$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || echo 000)
echo ">>> localhost:3000 → HTTP $APP_CODE"
if [ "$APP_CODE" != "200" ]; then
  echo ">>> PM2 error log:"
  pm2 logs vibe --lines 40 --nostream 2>/dev/null || true
fi

# --- Nginx HTTP ---
cat > /etc/nginx/sites-available/vibemusic.in <<'NGINX'
upstream vibe_nextjs { server 127.0.0.1:3000; keepalive 32; }
server {
    listen 80; listen [::]:80;
    server_name vibemusic.in www.vibemusic.in;
    client_max_body_size 25m;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / {
        proxy_pass http://vibe_nextjs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/vibemusic.in /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable nginx && systemctl reload nginx

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable || true

# --- SSL ---
if [ ! -f /etc/letsencrypt/live/vibemusic.in/fullchain.pem ]; then
  certbot certonly --webroot -w /var/www/certbot \
    -d vibemusic.in -d www.vibemusic.in \
    --non-interactive --agree-tos --email "ops@vibemusic.in" --no-eff-email \
    || certbot --nginx -d vibemusic.in -d www.vibemusic.in \
         --non-interactive --agree-tos --email "ops@vibemusic.in" --no-eff-email
fi

# --- Nginx HTTPS ---
if [ -f /etc/letsencrypt/live/vibemusic.in/fullchain.pem ]; then
cat > /etc/nginx/sites-available/vibemusic.in <<'NGINX'
upstream vibe_nextjs { server 127.0.0.1:3000; keepalive 32; }
server {
    listen 80; listen [::]:80;
    server_name vibemusic.in www.vibemusic.in;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}
server {
    listen 443 ssl http2; listen [::]:443 ssl http2;
    server_name vibemusic.in www.vibemusic.in;
    ssl_certificate     /etc/letsencrypt/live/vibemusic.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vibemusic.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    client_max_body_size 25m;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    gzip on; gzip_vary on; gzip_types text/plain text/css application/json application/javascript image/svg+xml;
    location /_next/static/ {
        proxy_pass http://vibe_nextjs;
        add_header Cache-Control "public, max-age=31536000, immutable";
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
        proxy_read_timeout 120s;
    }
}
NGINX
nginx -t && systemctl reload nginx
fi

echo ""
echo "========== RESULTS =========="
echo "App   : $(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/)"
echo "HTTP  : $(curl -sS -o /dev/null -w '%{http_code}' http://vibemusic.in/)"
echo "HTTPS : $(curl -sS -o /dev/null -w '%{http_code}' https://vibemusic.in/ 2>/dev/null || echo 'n/a')"
pm2 list
