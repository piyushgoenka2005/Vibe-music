# Paste into your active SSH session on root@87.232.72.14
# (public key only — safe to store in repo)

set -e
cd ~/Vibe-music
git pull origin main

SSH_PUBLIC_KEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG7w4KSd4mxynvRNf3f5CHMOjDHiN7U0CJBQQ+VtfhnS samiran.galaxydigital@gmail.com-vibe-vps' \
  bash deploy/vps-hardening.sh

bash deploy/update.sh
