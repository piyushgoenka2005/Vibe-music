#!/usr/bin/env bash
# Mail + security deep audit (no secrets printed)
set -uo pipefail
section(){ echo ""; echo "========== $1 =========="; }

section "Git vs GitHub"
APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"
git fetch origin main 2>/dev/null
echo "Local: $(git rev-parse HEAD)"
echo "Remote origin/main: $(git rev-parse origin/main)"
git log -1 --oneline origin/main
git diff --stat origin/main...HEAD 2>/dev/null || echo "No diff"
section "Mail - Postfix"
postconf -n 2>/dev/null | grep -E '^(myhostname|mydomain|myorigin|inet_interfaces|smtpd_tls|smtp_tls|mynetworks|virtual|home_mailbox|smtpd_sasl|smtpd_recipient_restrictions|smtpd_milters|non_smtpd_milters)' || true
postqueue -p 2>/dev/null | head -5 || true

section "Mail - Dovecot"
doveconf -n 2>/dev/null | grep -E '^(protocols|mail_location|ssl|auth_mechanisms|passdb|userdb|namespace)' || true
doveadm user contact@vibemusic.in 2>/dev/null || echo "contact@vibemusic.in: NOT FOUND"
doveadm user support@vibemusic.in 2>/dev/null || echo "support@vibemusic.in: NOT FOUND"
ls -la /etc/dovecot/users 2>/dev/null || ls -la /etc/dovecot/conf.d/auth* 2>/dev/null | head -5

section "Mail - OpenDKIM"
systemctl status opendkim --no-pager 2>/dev/null | head -8
ls -la /etc/opendkim/keys/ 2>/dev/null || ls -la /etc/opendkim/ 2>/dev/null | head -10
cat /etc/opendkim/KeyTable 2>/dev/null || true
cat /etc/opendkim/SigningTable 2>/dev/null || true

section "Mail - OpenDMARC"
systemctl status opendmarc --no-pager 2>/dev/null | head -8
cat /etc/opendmarc.conf 2>/dev/null | grep -v '^#' | grep -v '^$' | head -20 || true

section "Mail ports"
ss -tlnp | grep -E ':25|:465|:587|:993|:143' || true

section "Nginx full config"
wc -l /etc/nginx/sites-available/vibemusic.in
grep -E 'gzip|keepalive|proxy_|add_header|upstream|location' /etc/nginx/sites-available/vibemusic.in | head -40

section "Fail2ban jails"
fail2ban-client status 2>/dev/null
for jail in sshd nginx-http-auth postfix; do
  fail2ban-client status $jail 2>/dev/null | head -5 || true
done

section "SSH authorized keys"
wc -l /root/.ssh/authorized_keys 2>/dev/null || echo "no authorized_keys"

section "Unattended upgrades"
cat /etc/apt/apt.conf.d/20auto-upgrades 2>/dev/null || true

section "External DNS checks"
for t in MX TXT _dmarc mail; do
  echo "--- $t ---"
  dig +short $t.vibemusic.in 2>/dev/null || dig +short $t vibemusic.in 2>/dev/null
done
dig +short TXT vibemusic.in 2>/dev/null
dig +short TXT _dmarc.vibemusic.in 2>/dev/null
dig +short TXT default._domainkey.vibemusic.in 2>/dev/null
dig +short MX vibemusic.in 2>/dev/null

section "Mail TLS cert"
ls -la /etc/letsencrypt/live/ 2>/dev/null
certbot certificates 2>/dev/null

section "Test local SMTP"
echo "QUIT" | timeout 3 nc -w2 localhost 25 2>/dev/null | head -3 || true

echo "DEEP AUDIT DONE"
