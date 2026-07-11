# Self-Hosted SMTP Setup Guide

Vibe Music runs on a **VPS** with **self-hosted PostgreSQL** and **self-hosted SMTP**. Transactional email uses [Nodemailer](https://nodemailer.com/) against your mail server (e.g. `mail.vibemusic.in`). See [POSTGRESQL.md](./POSTGRESQL.md) for the database setup.

## Mailbox addresses

These sender identities are configured in the application (`src/lib/server/email/mailboxes.ts`):

| Address | Used for |
|---------|----------|
| `orders@vibemusic.in` | Order confirmations, invoices |
| `info@vibemusic.in` | Newsletter welcome emails |
| `support@vibemusic.in` | Password reset, customer support replies |
| `contact@vibemusic.in` | Contact form notifications (outbound to team) |
| `billing@vibemusic.in` | Admin ops alerts (low stock, billing) |

Admin notifications (contact form, low stock) are delivered to `SMTP_ADMIN_TO` (default: `support@vibemusic.in`).

## Application configuration

Add to `.env.local` / production environment:

```env
SMTP_HOST=mail.vibemusic.in
SMTP_PORT=587
SMTP_USER=orders@vibemusic.in
SMTP_PASS=your-app-password
# SMTP_SECURE=true          # use with port 465
# SMTP_ADMIN_TO=support@vibemusic.in
```

Production requires `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` (validated in `src/env.ts`).

### Verify from the app server

After deploy, check health integrations in development:

```bash
npm run verify:integrations
```

Optional manual SMTP test (Node REPL on VPS):

```javascript
const nodemailer = require("nodemailer");
const t = nodemailer.createTransport({
  host: "mail.vibemusic.in",
  port: 587,
  secure: false,
  auth: { user: "orders@vibemusic.in", pass: "..." },
});
await t.verify();
await t.sendMail({
  from: "Vibe Music Orders <orders@vibemusic.in>",
  to: "you@example.com",
  subject: "SMTP test",
  text: "OK",
});
```

---

## Option A: Postfix + Dovecot on Ubuntu (VPS)

This is a minimal production-oriented stack on the same VPS as the app or a dedicated mail VM.

### 1. DNS records

Configure at your DNS provider for `vibemusic.in`:

| Type | Name | Value | Notes |
|------|------|-------|-------|
| A | `mail` | `<VPS public IP>` | SMTP/IMAP host |
| MX | `@` | `10 mail.vibemusic.in` | Inbound mail |
| TXT | `@` | `v=spf1 mx a:mail.vibemusic.in -all` | SPF |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:info@vibemusic.in` | DMARC |
| TXT | `default._domainkey` | *(from OpenDKIM)* | DKIM |

Use [MXToolbox](https://mxtoolbox.com/) to validate after propagation.

### 2. Install packages

```bash
sudo apt update
sudo apt install -y postfix postfix-pcre dovecot-core dovecot-imapd \
  opendkim opendkim-tools certbot
```

During Postfix install, choose **Internet Site** and set `mail.vibemusic.in`.

### 3. TLS certificate

```bash
sudo certbot certonly --standalone -d mail.vibemusic.in
```

Postfix TLS paths (Let's Encrypt):

```
/etc/letsencrypt/live/mail.vibemusic.in/fullchain.pem
/etc/letsencrypt/live/mail.vibemusic.in/privkey.pem
```

### 4. Postfix — `/etc/postfix/main.cf` (essentials)

```ini
myhostname = mail.vibemusic.in
mydomain = vibemusic.in
myorigin = $mydomain
inet_interfaces = all
mydestination = $myhostname, localhost.$mydomain, localhost, $mydomain
relayhost =
home_mailbox = Maildir/

# TLS
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.vibemusic.in/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/mail.vibemusic.in/privkey.pem
smtpd_tls_security_level = may
smtp_tls_security_level = may

# Submission (587)
smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
smtpd_sasl_auth_enable = yes
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
broken_sasl_auth_clients = yes
```

`/etc/postfix/master.cf` — ensure submission is enabled:

```
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_client_restrictions=permit_sasl_authenticated,reject
```

### 5. Dovecot SASL for Postfix

`/etc/dovecot/conf.d/10-master.conf`:

```
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user = postfix
    group = postfix
  }
}
```

### 6. Create mail users (virtual mailboxes)

For simplicity, create system users or use virtual maps. Example system users per mailbox:

```bash
sudo adduser --disabled-login orders
sudo adduser --disabled-login support
# repeat for info, contact, billing
```

Set strong passwords; use these as `SMTP_USER` / `SMTP_PASS` in the app (one dedicated submission account is enough if all senders are allowed via `smtpd_sender_login_maps`).

**Recommended:** one submission account `smtp-app@vibemusic.in` allowed to send as any `@vibemusic.in` address via Postfix `sender_login_maps`.

### 7. OpenDKIM

```bash
sudo opendkim-genkey -b 2048 -d vibemusic.in -s default
sudo chown opendkim:opendkim /etc/opendkim/keys/vibemusic.in/default.private
```

Publish the `default.txt` public key as DNS TXT `default._domainkey.vibemusic.in`.

Wire OpenDKIM into Postfix (`/etc/postfix/main.cf`):

```ini
milter_default_action = accept
milter_protocol = 6
smtpd_milters = local:opendkim/opendkim.sock
non_smtpd_milters = $smtpd_milters
```

### 8. Firewall

```bash
sudo ufw allow 25/tcp    # SMTP (inbound from other MTAs)
sudo ufw allow 587/tcp   # Submission (app + clients)
sudo ufw allow 993/tcp   # IMAPS (optional webmail)
```

Ensure your cloud provider allows outbound port 25 (some block it by default).

### 9. Restart services

```bash
sudo systemctl restart postfix dovecot opendkim
sudo postfix check
```

---

## Option B: Mailcow (Docker)

Mailcow provides a web UI, DKIM/SPF helpers, and multiple mailboxes with less manual config.

1. Point `mail.vibemusic.in` A record to the server.
2. Follow [Mailcow install docs](https://docs.mailcow.email/getstarted/install/).
3. Create mailboxes: `orders`, `support`, `info`, `contact`, `billing`.
4. Use Mailcow's SMTP submission host (`mail.vibemusic.in:587`) and a mailbox password in app env.
5. Copy Mailcow's DKIM DNS records into your domain.

---

## Reverse DNS (PTR)

Set the VPS PTR record to `mail.vibemusic.in` via your hosting provider. Missing PTR is a common cause of spam-folder delivery.

---

## App architecture

```
src/lib/server/email/
  mailboxes.ts   — @vibemusic.in addresses
  smtp.ts        — Nodemailer transport + sendMail()
  index.ts       — public exports

Consumers:
  orderEmailService.ts              — orders@
  newsletterEmailService.ts         — info@
  passwordResetEmailService.ts      — support@
  adminNotificationEmailService.ts  — contact@ / billing@ → admin inbox
```

All sending goes through `sendMail()`; do not call Nodemailer directly from feature code.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Emails not sent in dev | Expected if `SMTP_HOST` unset — logs `[smtp] Skipped` |
| Auth failed | `SMTP_USER` / `SMTP_PASS`, Dovecot SASL, port 587 vs 465 |
| Lands in spam | SPF, DKIM, DMARC, PTR, low IP reputation |
| Connection timeout | Firewall, wrong host, provider blocking port 25/587 |
| TLS errors | `SMTP_TLS_REJECT_UNAUTHORIZED=false` only for dev/self-signed |

---

## Security notes

- Use app-specific passwords per environment (staging vs production).
- Restrict Postfix `mynetworks` and require SASL for submission.
- Never commit `SMTP_PASS` to git.
- Rotate credentials if leaked.
