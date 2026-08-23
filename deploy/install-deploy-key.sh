#!/usr/bin/env bash
# ============================================================================
# ONE-TIME: authorize the GitHub Actions deploy key on the VPS.
#
# Run this INSIDE your VPS web console (CloudonFire panel → console) as root:
#
#     curl -fsSL https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/install-deploy-key.sh | bash
#
# Or paste the public key first:
#     VIBE_DEPLOY_PUBKEY="ssh-ed25519 AAAA..." bash install-deploy-key.sh
#
# Safe to re-run (idempotent). It never removes existing keys.
# ============================================================================
set -euo pipefail

PUBKEY_FILE="$HOME/.ssh/vibe_vps_deploy.pub"

if [[ -z "${VIBE_DEPLOY_PUBKEY:-}" ]]; then
  if [[ -f "$PUBKEY_FILE" ]]; then
    # Case: running on the dev machine where the keypair lives.
    VIBE_DEPLOY_PUBKEY="$(cat "$PUBKEY_FILE")"
  else
    # Case: running on the VPS without the env var — fetch from GitHub raw.
    URL="https://raw.githubusercontent.com/piyushgoenka2005/Vibe-music/main/deploy/deploy_key.pub"
    echo "==> Fetching deploy public key from repository"
    VIBE_DEPLOY_PUBKEY="$(curl -fsSL "$URL")"
  fi
fi

if [[ ! "$VIBE_DEPLOY_PUBKEY" =~ ^(ssh-ed25519|ssh-rsa)\  ]]; then
  echo "ERROR: value does not look like a public key:" >&2
  echo "  $VIBE_DEPLOY_PUBKEY" | head -c 80 >&2
  exit 1
fi

install -d -m 700 -o root -g root /root/.ssh 2>/dev/null || install -d -m 700 "$HOME/.ssh"
touch /root/.ssh/authorized_keys 2>/dev/null || touch "$HOME/.ssh/authorized_keys"
AUTH_KEYS="/root/.ssh/authorized_keys"
[[ -w "$AUTH_KEYS" ]] || AUTH_KEYS="$HOME/.ssh/authorized_keys"

if grep -qxF "$VIBE_DEPLOY_PUBKEY" "$AUTH_KEYS"; then
  echo "==> Deploy key already present in $AUTH_KEYS"
else
  printf '%s\n' "$VIBE_DEPLOY_PUBKEY" >> "$AUTH_KEYS"
  echo "==> Key appended to $AUTH_KEYS"
fi

chmod 700 "$(dirname "$AUTH_KEYS")"
chmod 600 "$AUTH_KEYS"

echo ""
echo "DONE. Now verify from the dev machine:"
echo "    ssh -i ~/.ssh/vibe_vps_deploy <user>@87.232.72.14 'echo SSH-OK'"
echo ""
echo "GitHub repo → Settings → Secrets and variables → Actions:"
echo "    VPS_HOST = 87.232.72.14"
echo "    VPS_USER = $(id -un)"
echo "    VPS_PORT = 22"
echo "    VPS_SSH_KEY = contents of the PRIVATE key (~/.ssh/vibe_vps_deploy)"
echo ""
echo "Then re-run: Actions → Deploy production (vibemusic.in) → Re-run jobs"
