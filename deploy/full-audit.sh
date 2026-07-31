#!/usr/bin/env bash
# Comprehensive production audit — keys only for env, no secret values.
set -uo pipefail
section(){ echo ""; echo "========== $1 =========="; }

section "System"
hostname; hostname -f 2>/dev/null || true
lsb_release -a 2>/dev/null || cat /etc/os-release
echo "Uptime: $(uptime)"
echo "CPU cores: $(nproc)"
lscpu | grep -E 'Model name|CPU\(s\)|Thread|MHz' | head -5
free -h
df -h /

section "Tool versions"
node -v 2>/dev/null || echo "node: missing"
npm -v 2>/dev/null || echo "npm: missing"
pm2 -v 2>/dev/null || echo "pm2: missing"
nginx -v 2>&1 || echo "nginx: missing"
git --version 2>/dev/null || echo "git: missing"
docker --version 2>/dev/null || echo "Docker: not installed"
certbot --version 2>/dev/null || echo "certbot: not installed"

section "Services"
for s in nginx ssh ufw fail2ban postfix dovecot opendkim opendmarc; do
  printf "%-12s %s\n" "$s:" "$(systemctl is-active $s 2>/dev/null || echo inactive/missing)"
done
pm2 list 2>/dev/null || true

section "Firewall"
ufw status verbose 2>/dev/null || echo "ufw not active"

section "Open ports"
ss -tlnp 2>/dev/null | head -50

section "SSL"
certbot certificates 2>/dev/null || echo "no certbot certs"

section "DNS resolution"
for h in vibemusic.in www.vibemusic.in mail.vibemusic.in; do
  echo -n "$h A: "
  dig +short A "$h" 2>/dev/null || true
done
PUBIP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "Public IP: $PUBIP"
echo -n "Reverse DNS: "
dig +short -x "$PUBIP" 2>/dev/null || true

section "Nginx"
nginx -t 2>&1
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
echo "--- vibemusic.in config (first 95 lines) ---"
sed -n '1,95p' /etc/nginx/sites-enabled/vibemusic.in 2>/dev/null || sed -n '1,50p' /etc/nginx/sites-enabled/default 2>/dev/null || true

section "Mail packages & config"
dpkg -l 2>/dev/null | grep -E 'postfix|dovecot|opendkim|opendmarc|rspamd' || echo "No mail packages"
postconf -n 2>/dev/null | head -25 || true
doveconf -n 2>/dev/null | head -15 || true

section "Security"
fail2ban-client status 2>/dev/null || echo "fail2ban not running"
grep -E '^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|Port) ' /etc/ssh/sshd_config 2>/dev/null || true
ls -la /etc/ssh/sshd_config.d/ 2>/dev/null || true
dpkg -l unattended-upgrades 2>/dev/null | tail -1 || true

section "App deployment"
APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
if [ ! -d "$APP_DIR/.git" ]; then
  for d in /root/Vibe-music /root/vibe-music /var/www/Vibe-music /home/ubuntu/Vibe-music; do
    [ -d "$d/.git" ] && APP_DIR="$d" && break
  done
fi
echo "APP_DIR=$APP_DIR"
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git remote -v 2>/dev/null || true
  git branch -v 2>/dev/null || true
  git log -1 --oneline 2>/dev/null || true
  git fetch origin main 2>/dev/null || true
  echo "Behind/ahead origin/main:"
  git rev-list --left-right --count origin/main...HEAD 2>/dev/null || true
  [ -d .next ] && echo ".next build: OK" || echo ".next build: MISSING"
  ls -la .env* 2>/dev/null | awk '{print $9, $5}' || true
  if [ -f .env.local ]; then
    echo "Env keys (names only):"
    grep -E '^[A-Z_]+=' .env.local | cut -d= -f1 | sort
    for key in NODE_ENV PORT NEXT_PUBLIC_SITE_URL FIREBASE_PROJECT_ID UPSTASH_REDIS_REST_URL RAZORPAY_WEBHOOK_SECRET; do
      if grep -q "^${key}=" .env.local; then echo "  $key: set"; else echo "  $key: MISSING"; fi
    done
  fi
fi
pm2 describe vibe 2>/dev/null | head -30 || true

section "Health checks"
curl -sS -o /dev/null -w "localhost:3000 → HTTP %{http_code}\n" http://127.0.0.1:3000/ 2>/dev/null || echo "localhost:3000 unreachable"
curl -sS -o /dev/null -w "api/health → HTTP %{http_code}\n" http://127.0.0.1:3000/api/health 2>/dev/null || true
curl -sS -o /dev/null -w "nginx:80 → HTTP %{http_code}\n" http://127.0.0.1/ 2>/dev/null || true
curl -sS -o /dev/null -w "nginx:443 → HTTP %{http_code}\n" https://127.0.0.1/ -k 2>/dev/null || true

section "PM2 logs (last 25 lines)"
pm2 logs vibe --lines 25 --nostream 2>/dev/null | tail -35 || true

section "Nginx error log (last 15)"
tail -15 /var/log/nginx/error.log 2>/dev/null || true

echo ""
echo "AUDIT COMPLETE"
