#!/usr/bin/env bash
# Fix Dovecot config, reset mailbox passwords, validate mail stack
set -euo pipefail

DOMAIN="vibemusic.in"
MAIL_HOST="mail.vibemusic.in"
SELECTOR="default"
BACKUP="/root/vibe-backups/$(date +%Y%m%d-%H%M%S)-mailfix"
mkdir -p "$BACKUP"
cp -a /etc/dovecot/conf.d/10-mail.conf "$BACKUP/" 2>/dev/null || true

# Fix broken single-line namespace
cat > /etc/dovecot/conf.d/10-mail.conf <<'MAIL'
mail_location = maildir:/var/mail/vhosts/%d/%n
namespace inbox {
  inbox = yes
}
MAIL

# Ensure maildirs exist
mkdir -p /var/mail/vhosts/${DOMAIN}/{contact,support}
chown -R vmail:vmail /var/mail/vhosts 2>/dev/null || true

# Reset mailbox passwords (hashed only on disk)
CONTACT_PASS=$(openssl rand -base64 18)
SUPPORT_PASS=$(openssl rand -base64 18)
HASH_CONTACT=$(doveadm pw -s SHA512-CRYPT -p "$CONTACT_PASS")
HASH_SUPPORT=$(doveadm pw -s SHA512-CRYPT -p "$SUPPORT_PASS")
printf '%s\n' \
  "contact@${DOMAIN}:${HASH_CONTACT}:5000:5000::/var/mail/vhosts/${DOMAIN}/contact::" \
  "support@${DOMAIN}:${HASH_SUPPORT}:5001:5001::/var/mail/vhosts/${DOMAIN}/support::" \
  > /etc/dovecot/users
chmod 640 /etc/dovecot/users
chown root:dovecot /etc/dovecot/users

doveconf -n >/dev/null
systemctl restart dovecot
systemctl restart postfix

# Verify users
doveadm user contact@${DOMAIN}
doveadm user support@${DOMAIN}

# Local SMTP banner
echo "QUIT" | timeout 3 nc -w2 localhost 25 | head -1

# Test IMAP auth (localhost)
doveadm auth test contact@${DOMAIN} "$CONTACT_PASS" && echo "IMAP auth contact: OK"
doveadm auth test support@${DOMAIN} "$SUPPORT_PASS" && echo "IMAP auth support: OK"

# DKIM
if [ -f "/etc/opendkim/keys/${DOMAIN}/${SELECTOR}.txt" ]; then
  echo "DKIM_RECORD_START"
  cat "/etc/opendkim/keys/${DOMAIN}/${SELECTOR}.txt"
  echo "DKIM_RECORD_END"
fi

echo "MAILBOX_CREDENTIALS_START"
echo "host=${MAIL_HOST}"
echo "smtp_port=587"
echo "imap_port=993"
echo "contact@${DOMAIN}=${CONTACT_PASS}"
echo "support@${DOMAIN}=${SUPPORT_PASS}"
echo "MAILBOX_CREDENTIALS_END"

echo "SERVICES:"
systemctl is-active postfix dovecot opendkim opendmarc nginx
ss -tlnp | grep -E ':25|:587|:993' || true
echo "MAIL_FIX_DONE"
