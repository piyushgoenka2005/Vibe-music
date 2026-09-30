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
mkdir -p "$CDN_ROOT/products" "$CDN_ROOT/banners" "$CDN_ROOT/blog" "$CDN_ROOT/reviews"
chmod -R u+rwX,g+rwX "$CDN_ROOT" 2>/dev/null || true

install -d /etc/nginx/sites-available /etc/nginx/sites-enabled

# Disable rogue vhosts (Gitea panel, old tunnels) that steal default_server / SNI.
ALLOWED_SITES=(vibemusic.in cdn.vibemusic.in mail.vibemusic.in)
for link in /etc/nginx/sites-enabled/*; do
  [[ -e "$link" ]] || continue
  base="$(basename "$link")"
  keep=0
  for allowed in "${ALLOWED_SITES[@]}"; do
    if [[ "$base" == "$allowed" ]]; then
      keep=1
      break
    fi
  done
  if [[ "$keep" -eq 0 ]]; then
    echo "  ✕ disabling rogue nginx site: $base"
    rm -f "$link"
  fi
done

for site in "${ALLOWED_SITES[@]}"; do
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

mkdir -p /var/cache/nginx/vibe-pages /var/cache/nginx/vibe-images
chown -R www-data:www-data /var/cache/nginx/vibe-pages /var/cache/nginx/vibe-images 2>/dev/null || true

nginx -t

if command -v systemctl >/dev/null 2>&1; then
  systemctl reload-or-restart nginx 2>/dev/null || systemctl reload-or-restart nginx
else
  nginx -s reload 2>/dev/null || true
fi

echo "nginx synced and reloaded (CDN root: $CDN_ROOT)"
