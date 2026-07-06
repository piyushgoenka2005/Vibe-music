#!/usr/bin/env bash
set -euo pipefail

mkdir -p /etc/letsencrypt /var/www/certbot

if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
  curl -fsSL -o /etc/letsencrypt/options-ssl-nginx.conf \
    https://raw.githubusercontent.com/certbot/certbot/v2.9.0/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf
fi
if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
  curl -fsSL -o /etc/letsencrypt/ssl-dhparams.pem \
    https://raw.githubusercontent.com/certbot/certbot/v2.9.0/certbot/certbot/ssl-dhparams.pem
fi

rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/vibemusic
rm -f /etc/nginx/sites-enabled/vibemusic.in

cat > /etc/nginx/sites-available/vibemusic.in <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name vibemusic.in www.vibemusic.in;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
        default_type "text/plain";
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vibemusic.in www.vibemusic.in;

    ssl_certificate /etc/letsencrypt/live/vibemusic.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vibemusic.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

ln -sf /etc/nginx/sites-available/vibemusic.in /etc/nginx/sites-enabled/vibemusic.in
nginx -t
systemctl reload nginx

echo "HTTP  $(curl -sS -o /dev/null -w '%{http_code}' http://vibemusic.in/)"
echo "HTTPS $(curl -sS -o /dev/null -w '%{http_code}' https://vibemusic.in/)"
curl -sS -o /dev/null -w "localhost:3000 → %{http_code}\n" http://127.0.0.1:3000/
pm2 list
