#!/usr/bin/env bash
# Production hardening + mail completion for Vibe Music
# Safe: backs up configs before changes, never touches .env secrets
set -euo pipefail

BACKUP_DIR="/root/vibe-backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
log(){ echo "==> $*"; }
backup(){ [ -f "$1" ] && cp -a "$1" "$BACKUP_DIR/" && log "Backed up $1"; }

DOMAIN="vibemusic.in"
MAIL_HOST="mail.vibemusic.in"
APP_DIR="/root/Vibe-music"
SELECTOR="default"

log "Backup directory: $BACKUP_DIR"

# --- Phase 3: Deploy latest code ---
log "Deploy latest code"
cd "$APP_DIR"
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
echo "Local:  $LOCAL"
echo "Remote: $REMOTE"
if [ "$LOCAL" != "$REMOTE" ]; then
  git pull --ff-only origin main
  npm ci
  export NODE_ENV=production
  npm run build
  pm2 restart vibe --update-env
  pm2 save
else
  echo "Already on latest commit"
fi

# --- Phase 4: Nginx optimize (merge repo config safely) ---
log "Nginx optimization"
backup /etc/nginx/sites-available/vibemusic.in
if [ -f "$APP_DIR/deploy/nginx/vibemusic.in.conf" ]; then
  cp "$APP_DIR/deploy/nginx/vibemusic.in.conf" /etc/nginx/sites-available/vibemusic.in
  # Preserve existing HSTS if repo config lacks it
  if ! grep -q Strict-Transport-Security /etc/nginx/sites-available/vibemusic.in; then
    sed -i '/ssl_dhparam/a\    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;' /etc/nginx/sites-available/vibemusic.in
  fi
fi
nginx -t
systemctl reload nginx

# --- SSH: install deploy key (keep password auth until tested) ---
log "SSH: install deployment public key"
mkdir -p /root/.ssh
chmod 700 /root/.ssh
PUBKEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG7w4KSd4mxynvRNf3f5CHMOjDHiN7U0CJBQQ+VtfhnS samiran.galaxydigital@gmail.com-vibe-vps'
if ! grep -qF "$PUBKEY" /root/.ssh/authorized_keys 2>/dev/null; then
  echo "$PUBKEY" >> /root/.ssh/authorized_keys
fi
chmod 600 /root/.ssh/authorized_keys

# --- Enable unattended security upgrades ---
log "Enable unattended security upgrades"
printf '%s\n' \
  'APT::Periodic::Update-Package-Lists "1";' \
  'APT::Periodic::Unattended-Upgrade "1";' \
  'APT::Periodic::AutocleanInterval "7";' \
  > /etc/apt/apt.conf.d/20auto-upgrades
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq unattended-upgrades 2>/dev/null || true

# --- Phase 8: Close port 3000 from public firewall ---
log "Firewall: remove public access to port 3000"
ufw delete allow 3000/tcp 2>/dev/null || true
ufw status verbose | head -20

# --- Phase 6: Mail server completion ---
log "Mail server configuration"

apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  postfix postfix-pcre dovecot-core dovecot-imapd dovecot-lmtpd \
  opendkim opendkim-tools opendmarc \
  mailutils certbot 2>/dev/null || true

backup /etc/postfix/main.cf
backup /etc/postfix/master.cf
backup /etc/dovecot/dovecot.conf 2>/dev/null || true
for f in /etc/dovecot/conf.d/*.conf; do backup "$f" 2>/dev/null || true; done

# Generate mailbox passwords ephemerally (not stored in files beyond hashed)
MAIL_PASS_FILE=$(mktemp)
chmod 600 "$MAIL_PASS_FILE"
CONTACT_PASS=$(openssl rand -base64 18)
SUPPORT_PASS=$(openssl rand -base64 18)
echo "contact@vibemusic.in:$CONTACT_PASS" > "$MAIL_PASS_FILE"
echo "support@vibemusic.in:$SUPPORT_PASS" >> "$MAIL_PASS_FILE"

# Virtual mail users
backup /etc/postfix/virtual 2>/dev/null || true
cat > /etc/postfix/virtual <<EOF
contact@${DOMAIN} contact/
support@${DOMAIN} support/
EOF
postmap /etc/postfix/virtual

# Dovecot passwd file (hashed)
mkdir -p /etc/dovecot
backup /etc/dovecot/users 2>/dev/null || true
touch /etc/dovecot/users
chmod 640 /etc/dovecot/users
chown root:dovecot /etc/dovecot/users
HASH_CONTACT=$(doveadm pw -s SHA512-CRYPT -p "$CONTACT_PASS")
HASH_SUPPORT=$(doveadm pw -s SHA512-CRYPT -p "$SUPPORT_PASS")
cat > /etc/dovecot/users <<EOF
contact@${DOMAIN}:${HASH_CONTACT}:5000:5000::/var/mail/vhosts/${DOMAIN}/contact::
support@${DOMAIN}:${HASH_SUPPORT}:5001:5001::/var/mail/vhosts/${DOMAIN}/support::
EOF
chmod 640 /etc/dovecot/users

# Maildirs
groupadd -g 5000 vmail 2>/dev/null || true
useradd -u 5000 -g vmail -d /var/mail/vhosts -s /usr/sbin/nologin vmail 2>/dev/null || true
mkdir -p /var/mail/vhosts/${DOMAIN}/{contact,support}
chown -R vmail:vmail /var/mail/vhosts

# Postfix main.cf
cat > /etc/postfix/main.cf <<EOF
# Vibe Music production mail — generated $(date -Iseconds)
smtpd_banner = \$myhostname ESMTP
biff = no
append_dot_mydomain = no
readme_directory = no
compatibility_level = 3.6

myhostname = ${MAIL_HOST}
mydomain = ${DOMAIN}
myorigin = \$mydomain
mydestination = localhost
inet_interfaces = all
inet_protocols = all

# TLS
smtpd_tls_cert_file = /etc/letsencrypt/live/${DOMAIN}/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/${DOMAIN}/privkey.pem
smtpd_tls_security_level = may
smtpd_tls_auth_only = yes
smtp_tls_security_level = may
smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1

# Virtual domains
virtual_mailbox_domains = ${DOMAIN}
virtual_mailbox_base = /var/mail/vhosts
virtual_mailbox_maps = hash:/etc/postfix/virtual
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000
virtual_transport = lmtp:unix:private/dovecot-lmtp

# SASL / auth for submission
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = \$myhostname
broken_sasl_auth_clients = yes

# Milters (DKIM + DMARC)
milter_default_action = accept
milter_protocol = 6
smtpd_milters = inet:127.0.0.1:8891, inet:127.0.0.1:8893
non_smtpd_milters = inet:127.0.0.1:8891, inet:127.0.0.1:8893

# Restrictions
smtpd_helo_required = yes
smtpd_recipient_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_unauth_destination,
    reject_invalid_hostname,
    reject_non_fqdn_recipient

mynetworks = 127.0.0.0/8 [::1]/128
EOF

# Master.cf — enable submission 587
backup /etc/postfix/master.cf
grep -q '^submission' /etc/postfix/master.cf || cat >> /etc/postfix/master.cf <<'EOF'

submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
EOF

# Dovecot
cat > /etc/dovecot/conf.d/10-mail.conf <<EOF
mail_location = maildir:/var/mail/vhosts/%d/%n
namespace inbox {
  inbox = yes
}
EOF

cat > /etc/dovecot/conf.d/10-auth.conf <<EOF
disable_plaintext_auth = yes
auth_mechanisms = plain login
!include auth-passwdfile.conf.ext
EOF

cat > /etc/dovecot/conf.d/auth-passwdfile.conf.ext <<EOF
passdb {
  driver = passwd-file
  args = scheme=SHA512-CRYPT username_format=%u /etc/dovecot/users
}
userdb {
  driver = passwd-file
  args = username_format=%u /etc/dovecot/users
}
EOF

cat > /etc/dovecot/conf.d/10-master.conf <<'EOF'
service lmtp {
  unix_listener /var/spool/postfix/private/dovecot-lmtp {
    mode = 0600
    user = postfix
    group = postfix
  }
}
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user = postfix
    group = postfix
  }
  unix_listener auth-userdb {
    mode = 0600
    user = vmail
  }
}
service auth-worker {
  user = vmail
}
EOF

cat > /etc/dovecot/conf.d/10-ssl.conf <<EOF
ssl = required
ssl_cert = </etc/letsencrypt/live/${DOMAIN}/fullchain.pem
ssl_key = </etc/letsencrypt/live/${DOMAIN}/privkey.pem
ssl_min_protocol = TLSv1.2
EOF

cat > /etc/dovecot/conf.d/10-logging.conf <<EOF
log_path = /var/log/dovecot.log
info_log_path = /var/log/dovecot-info.log
EOF

# OpenDKIM
mkdir -p /etc/opendkim/keys/${DOMAIN}
backup /etc/opendkim.conf 2>/dev/null || true
if [ ! -f "/etc/opendkim/keys/${DOMAIN}/${SELECTOR}.private" ]; then
  opendkim-genkey -b 2048 -d ${DOMAIN} -s ${SELECTOR} -D /etc/opendkim/keys/${DOMAIN}/
fi
chown -R opendkim:opendkim /etc/opendkim
chmod 600 /etc/opendkim/keys/${DOMAIN}/${SELECTOR}.private 2>/dev/null || true

cat > /etc/opendkim/KeyTable <<EOF
${SELECTOR}._domainkey.${DOMAIN} ${DOMAIN}:${SELECTOR}:/etc/opendkim/keys/${DOMAIN}/${SELECTOR}.private
EOF
cat > /etc/opendkim/SigningTable <<EOF
*@${DOMAIN} ${SELECTOR}._domainkey.${DOMAIN}
EOF
cat > /etc/opendkim/TrustedHosts <<EOF
127.0.0.1
localhost
${MAIL_HOST}
.${DOMAIN}
EOF

cat > /etc/opendkim.conf <<EOF
Syslog yes
SyslogSuccess yes
LogWhy yes
Canonicalization relaxed/simple
Mode sv
SubDomains no
AutoRestart yes
AutoRestartRate 10/1M
Background yes
DNSTimeout 5
SignatureAlgorithm rsa-sha256
KeyTable /etc/opendkim/KeyTable
SigningTable refile:/etc/opendkim/SigningTable
ExternalIgnoreList refile:/etc/opendkim/TrustedHosts
InternalHosts refile:/etc/opendkim/TrustedHosts
Socket inet:8891@127.0.0.1
PidFile /run/opendkim/opendkim.pid
UMask 002
UserID opendkim
TemporaryDirectory /var/tmp
EOF

# OpenDMARC
cat > /etc/opendmarc.conf <<EOF
AuthservID ${MAIL_HOST}
PidFile /run/opendmarc/opendmarc.pid
RejectFailures false
Syslog true
TrustedAuthservIDs ${MAIL_HOST}
Socket inet:8893@127.0.0.1
SPFSelfValidate true
EOF

# Fail2ban postfix jail
if [ -f /etc/fail2ban/jail.local ]; then backup /etc/fail2ban/jail.local; fi
grep -q '\[postfix\]' /etc/fail2ban/jail.local 2>/dev/null || cat >> /etc/fail2ban/jail.local <<'EOF'

[postfix]
enabled = true
port = smtp,465,submission
filter = postfix
logpath = /var/log/mail.log
maxretry = 5
EOF

# Log rotation for mail
cat > /etc/logrotate.d/vibe-mail <<'EOF'
/var/log/mail.log
/var/log/dovecot*.log {
  weekly
  rotate 8
  compress
  delaycompress
  missingok
  notifempty
  create 640 root adm
  sharedscripts
  postrotate
    systemctl reload rsyslog > /dev/null 2>&1 || true
  endscript
}
EOF

# UFW mail ports
ufw allow 25/tcp comment 'SMTP' 2>/dev/null || true
ufw allow 587/tcp comment 'Submission' 2>/dev/null || true
ufw allow 993/tcp comment 'IMAPS' 2>/dev/null || true

# Restart services
postmap /etc/postfix/virtual
systemctl enable postfix dovecot opendkim opendmarc
systemctl restart opendkim opendmarc
systemctl restart postfix
systemctl restart dovecot
systemctl restart fail2ban

# Output DKIM public key and mailbox passwords ONCE to stdout (operator must save)
echo ""
echo "========== MAILBOX CREDENTIALS (SAVE NOW — NOT STORED ON DISK) =========="
echo "IMAP/SMTP host: ${MAIL_HOST}"
echo "SMTP port: 587 (STARTTLS, authenticated)"
echo "IMAP port: 993 (SSL/TLS)"
echo ""
echo "contact@${DOMAIN} password: ${CONTACT_PASS}"
echo "support@${DOMAIN} password: ${SUPPORT_PASS}"
echo ""
echo "========== DKIM DNS RECORD =========="
DKIM_TXT=$(grep -oP '(?<=")[^"]+(?=")' /etc/opendkim/keys/${DOMAIN}/${SELECTOR}.txt 2>/dev/null | tr -d '\n\t ' || cat /etc/opendkim/keys/${DOMAIN}/${SELECTOR}.txt)
echo "Host: ${SELECTOR}._domainkey.${DOMAIN}"
echo "Type: TXT"
echo "Value: ${DKIM_TXT}"
echo ""
rm -f "$MAIL_PASS_FILE"

# --- Validation ---
log "Validation"
curl -sS -o /dev/null -w "site → %{http_code}\n" http://127.0.0.1:3000/
curl -sS -o /dev/null -w "health → %{http_code}\n" http://127.0.0.1:3000/api/health
curl -sS -o /dev/null -w "nginx https → %{http_code}\n" https://127.0.0.1/ -k
echo "QUIT" | timeout 3 nc -w2 localhost 25 | head -1
echo "Services:"
for s in nginx postfix dovecot opendkim opendmarc pm2; do
  systemctl is-active $s 2>/dev/null || pm2 list 2>/dev/null | grep -q online && echo "$s: ok" || echo "$s: check"
done
echo "HARDENING COMPLETE"
echo "Backup at: $BACKUP_DIR"
