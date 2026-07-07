#!/usr/bin/env bash
# VPS security baseline: SSH key auth, UFW, fail2ban, PM2 startup, unattended upgrades.
#
# Run on the server as root AFTER adding your SSH public key:
#   SSH_PUBLIC_KEY='ssh-ed25519 AAAA... you@host' bash deploy/vps-hardening.sh
#
# To disable password login (only after key login works in a second terminal):
#   DISABLE_PASSWORD_AUTH=1 SSH_PUBLIC_KEY='...' bash deploy/vps-hardening.sh
set -euo pipefail

log() { echo "==> $*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root." >&2
  exit 1
fi

# --- SSH public key ---
if [ -n "${SSH_PUBLIC_KEY:-}" ]; then
  log "Installing SSH public key for root"
  install -d -m 700 /root/.ssh
  touch /root/.ssh/authorized_keys
  chmod 600 /root/.ssh/authorized_keys
  if ! grep -qF "$SSH_PUBLIC_KEY" /root/.ssh/authorized_keys; then
    echo "$SSH_PUBLIC_KEY" >> /root/.ssh/authorized_keys
    log "Key added to /root/.ssh/authorized_keys"
  else
    log "Key already present"
  fi
else
  echo "WARNING: SSH_PUBLIC_KEY not set — skipping key install." >&2
  echo "Set SSH_PUBLIC_KEY before disabling password auth." >&2
fi

# --- Packages ---
log "Updating packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ufw fail2ban unattended-upgrades apt-listchanges

# --- UFW ---
log "Configuring firewall (UFW)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
# Node listens on 127.0.0.1:3000 only — do not expose :3000 publicly
ufw --force enable
ufw status verbose

# --- fail2ban ---
log "Enabling fail2ban (sshd jail)"
install -d -m 755 /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/vibe-sshd.local <<'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable fail2ban
systemctl restart fail2ban

# --- unattended security upgrades ---
log "Enabling unattended security upgrades"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

# --- SSH hardening ---
log "Hardening sshd"
SSHD_DROPIN="/etc/ssh/sshd_config.d/99-vibe-hardening.conf"
cat > "$SSHD_DROPIN" <<'EOF'
# Vibe Music VPS baseline
PermitRootLogin prohibit-password
PubkeyAuthentication yes
PasswordAuthentication yes
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
X11Forwarding no
MaxAuthTries 5
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

if [ "${DISABLE_PASSWORD_AUTH:-0}" = "1" ]; then
  if [ -z "${SSH_PUBLIC_KEY:-}" ]; then
    echo "Refusing to disable password auth without SSH_PUBLIC_KEY." >&2
    exit 1
  fi
  log "Disabling password authentication (key-only)"
  sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' "$SSHD_DROPIN"
fi

sshd -t
systemctl reload ssh

# --- PM2 log dir + startup ---
log "PM2 startup on boot"
install -d -m 755 /var/log/vibe
pm2 startup systemd -u root --hp /root 2>/dev/null | grep -E '^sudo' | bash || true
pm2 save

# --- Nginx ---
if command -v nginx >/dev/null; then
  log "Ensuring nginx is enabled"
  systemctl enable nginx
  nginx -t && systemctl reload nginx
fi

log "Hardening complete."
echo ""
echo "Next steps:"
echo "  1. Open a NEW terminal and test: ssh -i ~/.ssh/id_ed25519_vibe root@87.232.72.14"
echo "  2. If key login works, re-run with DISABLE_PASSWORD_AUTH=1 to turn off passwords."
echo "  3. Change the root password: passwd"
