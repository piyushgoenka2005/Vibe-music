#!/usr/bin/env bash
set -uo pipefail
section(){ echo ""; echo "=== $1 ==="; }

section "Git"
cd /root/Vibe-music
git fetch origin main 2>/dev/null
echo "Branch: $(git branch --show-current)"
echo "Commit: $(git log -1 --oneline)"
echo "origin/main: $(git log -1 --oneline origin/main)"
git rev-list --left-right --count origin/main...HEAD 2>/dev/null

section "Website"
curl -sS -o /dev/null -w "localhost:3000 → %{http_code}\n" http://127.0.0.1:3000/
curl -sS -o /dev/null -w "api/health → %{http_code}\n" http://127.0.0.1:3000/api/health
curl -sS -o /dev/null -w "api/coupons/active → %{http_code}\n" http://127.0.0.1:3000/api/coupons/active
curl -sS -o /dev/null -w "nginx:443 → %{http_code}\n" https://127.0.0.1/ -k
curl -sS -o /dev/null -w "http redirect → %{http_code}\n" http://127.0.0.1/ -L -o /dev/null -w "%{url_effective}\n" 2>/dev/null || true
bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/post-deploy-smoke.sh" || true

section "PM2"
pm2 list
pm2 logs vibe --lines 10 --nostream 2>/dev/null | tail -15

section "Nginx"
nginx -t 2>&1
grep -E 'gzip|HSTS|proxy_pass|keepalive' /etc/nginx/sites-available/vibemusic.in | head -15

section "SSL"
certbot certificates 2>/dev/null | grep -E 'Certificate Name|Domains|Expiry'

section "Mail"
postconf myhostname mydomain 2>/dev/null
systemctl is-active postfix dovecot opendkim opendmarc
doveadm user contact@vibemusic.in 2>/dev/null | head -3
doveadm user support@vibemusic.in 2>/dev/null | head -3
postqueue -p 2>/dev/null | head -3
ss -tlnp | grep -E ':25|:587|:993' || true

section "DNS"
dig +short A vibemusic.in
dig +short A mail.vibemusic.in
dig +short MX vibemusic.in
dig +short TXT vibemusic.in
dig +short TXT _dmarc.vibemusic.in
dig +short TXT default._domainkey.vibemusic.in

section "Security"
ufw status | head -12
fail2ban-client status 2>/dev/null
cat /etc/apt/apt.conf.d/20auto-upgrades 2>/dev/null
wc -l /root/.ssh/authorized_keys

section "Disk/Memory"
df -h / | tail -1
free -h | head -2

echo "VALIDATION_DONE"
