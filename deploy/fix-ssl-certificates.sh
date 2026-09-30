#!/usr/bin/env bash
# Expand Let's Encrypt SANs and sync nginx SSL vhosts (mail + default_server).
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo "==> Installing nginx site configs"
install -d /etc/nginx/sites-available /etc/nginx/sites-enabled
cp deploy/nginx/vibemusic.in.conf /etc/nginx/sites-available/vibemusic.in
cp deploy/nginx/cdn.vibemusic.in.conf /etc/nginx/sites-available/cdn.vibemusic.in
cp deploy/nginx/mail.vibemusic.in.conf /etc/nginx/sites-available/mail.vibemusic.in
ln -sf /etc/nginx/sites-available/vibemusic.in /etc/nginx/sites-enabled/vibemusic.in
ln -sf /etc/nginx/sites-available/cdn.vibemusic.in /etc/nginx/sites-enabled/cdn.vibemusic.in
ln -sf /etc/nginx/sites-available/mail.vibemusic.in /etc/nginx/sites-enabled/mail.vibemusic.in

if ! grep -rqsE '^\s*server_names_hash_bucket_size' /etc/nginx/nginx.conf /etc/nginx/conf.d/; then
  echo 'server_names_hash_bucket_size 128;' > /etc/nginx/conf.d/00-hash.conf
fi

echo "==> Expanding certificate for vibemusic.in + www + mail"
if command -v certbot >/dev/null 2>&1; then
  certbot certonly --nginx \
    -d vibemusic.in \
    -d www.vibemusic.in \
    -d mail.vibemusic.in \
    --expand \
    --non-interactive \
    --agree-tos \
    --keep-until-expiring \
    || certbot certonly --nginx \
      -d vibemusic.in \
      -d www.vibemusic.in \
      -d mail.vibemusic.in \
      --expand \
      --non-interactive \
      --agree-tos
else
  echo "WARN: certbot not installed — skipping certificate expand" >&2
fi

echo "==> Certificate SANs"
openssl x509 -in /etc/letsencrypt/live/vibemusic.in/fullchain.pem -noout -subject -ext subjectAltName 2>/dev/null || true

nginx -t
systemctl reload-or-restart nginx

echo "==> SSL probe (public IP + SNI)"
for sni in vibemusic.in www.vibemusic.in mail.vibemusic.in; do
  subj=$(echo | openssl s_client -connect 127.0.0.1:443 -servername "$sni" 2>/dev/null | openssl x509 -noout -subject 2>/dev/null || echo FAIL)
  echo "  $sni -> $subj"
done

echo "SSL fix complete."
