#!/usr/bin/env bash
# Sync nginx vhosts from repo + reload. Run on CloudOnFire VPS as root.
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

if ! command -v nginx >/dev/null 2>&1; then
  echo "nginx not installed — skipping sync"
  exit 0
fi

CDN_ROOT="${CDN_STORAGE_ROOT:-/var/www/cdn}"
mkdir -p "$CDN_ROOT/products" "$CDN_ROOT/banners" "$CDN_ROOT/blog"

install -d /etc/nginx/sites-available /etc/nginx/sites-enabled

for site in vibemusic.in cdn.vibemusic.in mail.vibemusic.in; do
  conf="deploy/nginx/${site}.conf"
  if [[ -f "$conf" ]]; then
    echo "  → $site"
    cp "$conf" "/etc/nginx/sites-available/${site}"
    ln -sf "/etc/nginx/sites-available/${site}" "/etc/nginx/sites-enabled/${site}"
  fi
done

bash deploy/strip-legacy-edge-proxy.sh

if ! grep -rqsE '^\s*server_names_hash_bucket_size' /etc/nginx/nginx.conf /etc/nginx/conf.d/ 2>/dev/null; then
  echo 'server_names_hash_bucket_size 128;' > /etc/nginx/conf.d/00-hash.conf
fi

nginx -t

if command -v systemctl >/dev/null 2>&1; then
  systemctl reload-or-restart nginx 2>/dev/null || systemctl reload-or-restart nginx
else
  nginx -s reload 2>/dev/null || true
fi

echo "nginx synced and reloaded (CDN root: $CDN_ROOT)"
