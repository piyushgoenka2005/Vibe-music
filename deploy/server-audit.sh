#!/usr/bin/env bash
# Phase 1–2 audit for Vibe Music VPS. Run as root on the server:
#   bash deploy/server-audit.sh | tee /root/vibe-audit-$(date +%F).log
set -uo pipefail

section() { echo ""; echo "========== $1 =========="; }

section "System"
uname -a
lsb_release -a 2>/dev/null || cat /etc/os-release
echo "Uptime: $(uptime)"
echo "CPU: $(nproc) cores"
free -h
df -h /

section "Tool versions"
command -v node && node -v
command -v npm && npm -v
command -v pm2 && pm2 -v
command -v nginx && nginx -v 2>&1
command -v git && git --version

section "Services"
systemctl is-active nginx || true
systemctl is-active ssh || true
systemctl is-active ufw 2>/dev/null || true
systemctl is-active fail2ban 2>/dev/null || true
pm2 list || true

section "Firewall"
ufw status verbose 2>/dev/null || echo "ufw not installed"

section "Listening ports"
ss -tlnp | grep -E ':80|:443|:3000|:22' || true

section "Nginx config test"
nginx -t 2>&1 || true
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true

section "Nginx error log (last 40)"
tail -n 40 /var/log/nginx/error.log 2>/dev/null || true

section "Nginx access log (last 20)"
tail -n 20 /var/log/nginx/access.log 2>/dev/null || true

section "PM2 logs (last 60 lines each)"
pm2 logs vibe --lines 60 --nostream 2>/dev/null || true

section "App directory"
APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
if [[ ! -d "$APP_DIR" ]]; then
  for d in /root/Vibe-music /root/vibe-music /var/www/Vibe-music /home/ubuntu/Vibe-music; do
    [[ -d "$d" ]] && APP_DIR="$d" && break
  done
fi
if [ -d "$APP_DIR" ]; then
  ls -la "$APP_DIR" | head -20
  [ -f "$APP_DIR/package.json" ] && head -5 "$APP_DIR/package.json"
  [ -d "$APP_DIR/.next" ] && echo ".next build: OK" || echo ".next build: MISSING"
else
  echo "Set APP_DIR to your project path. Tried: $APP_DIR"
  find /root /var/www /home -maxdepth 3 -name package.json 2>/dev/null | head -10
fi

section "Environment (keys only — no secrets)"
ENV_FILE="${APP_DIR}/.env.production"
[ -f "${APP_DIR}/.env.local" ] && ENV_FILE="${APP_DIR}/.env.local"
[ -f "${APP_DIR}/.env" ] && ENV_FILE="${APP_DIR}/.env"
if [ -f "$ENV_FILE" ]; then
  echo "Env file: $ENV_FILE"
  grep -E '^[A-Z_]+=' "$ENV_FILE" | cut -d= -f1 | sort
  for key in NODE_ENV PORT NEXT_PUBLIC_SITE_URL FIREBASE_PROJECT_ID UPSTASH_REDIS_REST_URL RAZORPAY_WEBHOOK_SECRET; do
    if grep -q "^${key}=" "$ENV_FILE"; then echo "  $key: set"; else echo "  $key: MISSING"; fi
  done
  if grep -q '^FIREBASE_PRIVATE_KEY=.*\\\\n' "$ENV_FILE"; then
    echo "  FIREBASE_PRIVATE_KEY: has literal \\n (OK)"
  elif grep -q '^FIREBASE_PRIVATE_KEY="-----BEGIN' "$ENV_FILE"; then
    echo "  FIREBASE_PRIVATE_KEY: multiline PEM (verify formatting)"
  else
    echo "  FIREBASE_PRIVATE_KEY: check format"
  fi
else
  echo "No .env.production / .env.local / .env found under $APP_DIR"
fi

section "Local health checks"
curl -sS -o /dev/null -w "localhost:3000 → HTTP %{http_code}\n" http://127.0.0.1:3000/ || echo "localhost:3000 unreachable"
curl -sS -o /dev/null -w "localhost/api/health → HTTP %{http_code}\n" http://127.0.0.1:3000/api/health || true
curl -sS -o /dev/null -w "nginx :80 → HTTP %{http_code}\n" http://127.0.0.1/ || true
curl -sS -o /dev/null -w "nginx :443 → HTTP %{http_code}\n" https://127.0.0.1/ -k || true

section "SSL"
certbot certificates 2>/dev/null || echo "certbot not installed or no certs"

echo ""
echo "Audit complete."
