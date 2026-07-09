#!/usr/bin/env bash
# Mail server completion (continues after partial hardening run)
set -euo pipefail

BACKUP_DIR="/root/vibe-backups/$(date +%Y%m%d-%H%M%S)-mail"
mkdir -p "$BACKUP_DIR"
log(){ echo "==> $*"; }
backup(){ [ -f "$1" ] && cp -a "$1" "$BACKUP_DIR/" && log "Backed up $1"; }

DOMAIN="vibemusic.in"
MAIL_HOST="mail.vibemusic.in"
SELECTOR="default"

log "Firewall: remove public access to port 3000"
ufw delete allow 3000/tcp 2>/dev/null || true

log "Mail packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq postfix postfix-pcre dovecot-core dovecot-imapd dovecot-lmtpd \
  opendkim opendkim-tools opendmarc mailutils 2>/dev/null || true

backup /etc/postfix/main.cf
backup /etc/postfix/master.cf
for f in /etc/dovecot/conf.d/*.conf; do backup "$f" 2>/dev/null || true; done

CONTACT_PASS=$(openssl rand -base64 18)
SUPPORT_PASS=$(openssl rand -base64 18)

printf '%s\n' "contact@${DOMAIN} contact/" "support@${DOMAIN} support/" > /etc/postfix/virtual
postmap /etc/postfix/virtual

HASH_CONTACT=$(doveadm pw -s SHA512-CRYPT -p "$CONTACT_PASS")
HASH_SUPPORT=$(doveadm pw -s SHA512-CRYPT -p "$SUPPORT_PASS")
printf '%s\n' \
  "contact@${DOMAIN}:${HASH_CONTACT}:5000:5000::/var/mail/vhosts/${DOMAIN}/contact::" \
  "support@${DOMAIN}:${HASH_SUPPORT}:5001:5001::/var/mail/vhosts/${DOMAIN}/support::" \
  > /etc/dovecot/users
chmod 640 /etc/dovecot/users
chown root:dovecot /etc/dovecot/users

groupadd -g 5000 vmail 2>/dev/null || true
useradd -u 5000 -g vmail -d /var/mail/vhosts -s /usr/sbin/nologin vmail 2>/dev/null || true
mkdir -p /var/mail/vhosts/${DOMAIN}/{contact,support}
chown -R vmail:vmail /var/mail/vhosts

cat > /etc/postfix/main.cf <<MAINCF
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
smtpd_tls_cert_file = /etc/letsencrypt/live/${DOMAIN}/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/${DOMAIN}/privkey.pem
smtpd_tls_security_level = may
smtpd_tls_auth_only = yes
smtp_tls_security_level = may
smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
virtual_mailbox_domains = ${DOMAIN}
virtual_mailbox_base = /var/mail/vhosts
virtual_mailbox_maps = hash:/etc/postfix/virtual
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000
virtual_transport = lmtp:unix:private/dovecot-lmtp
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = \$myhostname
broken_sasl_auth_clients = yes
milter_default_action = accept
milter_protocol = 6
smtpd_milters = inet:127.0.0.1:8891, inet:127.0.0.1:8893
non_smtpd_milters = inet:127.0.0.1:8891, inet:127.0.0.1:8893
smtpd_helo_required = yes
smtpd_recipient_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination, reject_invalid_hostname, reject_non_fqdn_recipient
mynetworks = 127.0.0.0/8 [::1]/128
MAINCF

if ! grep -q '^submission inet' /etc/postfix/master.cf; then
  printf '\n%s\n' \
    'submission inet n       -       y       -       -       smtpd' \
    '  -o syslog_name=postfix/submission' \
    '  -o smtpd_tls_security_level=encrypt' \
    '  -o smtpd_sasl_auth_enable=yes' \
    '  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject' \
    '  -o milter_macro_daemon_name=ORIGINATING' >> /etc/postfix/master.cf
fi

printf '%s\n' \
  'mail_location = maildir:/var/mail/vhosts/%d/%n' \
  'namespace inbox { inbox = yes }' > /etc/dovecot/conf.d/10-mail.conf

printf '%s\n' \
  'disable_plaintext_auth = yes' \
  'auth_mechanisms = plain login' \
  '!include auth-passwdfile.conf.ext' > /etc/dovecot/conf.d/10-auth.conf

printf '%s\n' \
  'passdb {' \
  '  driver = passwd-file' \
  '  args = scheme=SHA512-CRYPT username_format=%u /etc/dovecot/users' \
  '}' \
  'userdb {' \
  '  driver = passwd-file' \
  '  args = username_format=%u /etc/dovecot/users' \
  '}' > /etc/dovecot/conf.d/auth-passwdfile.conf.ext

cat > /etc/dovecot/conf.d/10-master.conf <<'MASTER'
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
MASTER

printf '%s\n' \
  'ssl = required' \
  "ssl_cert = </etc/letsencrypt/live/${DOMAIN}/fullchain.pem" \
  "ssl_key = </etc/letsencrypt/live/${DOMAIN}/privkey.pem" \
  'ssl_min_protocol = TLSv1.2' > /etc/dovecot/conf.d/10-ssl.conf

mkdir -p /etc/opendkim/keys/${DOMAIN}
if [ ! -f "/etc/opendkim/keys/${DOMAIN}/${SELECTOR}.private" ]; then
  opendkim-genkey -b 2048 -d ${DOMAIN} -s ${SELECTOR} -D /etc/opendkim/keys/${DOMAIN}/
fi
chown -R opendkim:opendkim /etc/opendkim
chmod 600 /etc/opendkim/keys/${DOMAIN}/${SELECTOR}.private

printf '%s\n' \
  "${SELECTOR}._domainkey.${DOMAIN} ${DOMAIN}:${SELECTOR}:/etc/opendkim/keys/${DOMAIN}/${SELECTOR}.private" \
  > /etc/opendkim/KeyTable
printf '%s\n' "*@${DOMAIN} ${SELECTOR}._domainkey.${DOMAIN}" > /etc/opendkim/SigningTable
printf '%s\n' '127.0.0.1' 'localhost' "${MAIL_HOST}" ".${DOMAIN}" > /etc/opendkim/TrustedHosts

cat > /etc/opendkim.conf <<OPENDKIM
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
OPENDKIM

cat > /etc/opendmarc.conf <<OPENDMARC
AuthservID ${MAIL_HOST}
PidFile /run/opendmarc/opendmarc.pid
RejectFailures false
Syslog true
TrustedAuthservIDs ${MAIL_HOST}
Socket inet:8893@127.0.0.1
SPFSelfValidate true
OPENDMARC

touch /etc/fail2ban/jail.local
if ! grep -q '^\[postfix\]' /etc/fail2ban/jail.local; then
  printf '\n%s\n' '[postfix]' 'enabled = true' 'port = smtp,465,submission' \
    'filter = postfix' 'logpath = /var/log/mail.log' 'maxretry = 5' >> /etc/fail2ban/jail.local
fi

ufw allow 25/tcp 2>/dev/null || true
ufw allow 587/tcp 2>/dev/null || true
ufw allow 993/tcp 2>/dev/null || true

postmap /etc/postfix/virtual
systemctl enable postfix dovecot opendkim opendmarc
systemctl restart opendkim
systemctl restart opendmarc
systemctl restart postfix
systemctl restart dovecot
systemctl restart fail2ban

doveadm user contact@${DOMAIN} || true
doveadm user support@${DOMAIN} || true

echo ""
echo "========== MAILBOX CREDENTIALS (SAVE NOW) =========="
echo "Host: ${MAIL_HOST}"
echo "SMTP: 587 STARTTLS | IMAP: 993 SSL"
echo "contact@${DOMAIN} : ${CONTACT_PASS}"
echo "support@${DOMAIN} : ${SUPPORT_PASS}"
echo ""
echo "========== DKIM DNS =========="
cat /etc/opendkim/keys/${DOMAIN}/${SELECTOR}.txt
echo ""
echo "========== VALIDATION =========="
postfix check
doveconf -n >/dev/null && echo "dovecot config OK"
curl -sS -o /dev/null -w "site %{http_code}\n" http://127.0.0.1:3000/
curl -sS -o /dev/null -w "health %{http_code}\n" http://127.0.0.1:3000/api/health
ss -tlnp | grep -E ':25|:587|:993' || true
systemctl is-active postfix dovecot opendkim opendmarc nginx
echo "Backup: $BACKUP_DIR"
