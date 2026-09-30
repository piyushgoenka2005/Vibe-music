#!/usr/bin/env bash
# Single-instance production deploy (used when CI SSH drops mid-flight).
set -euo pipefail
exec 9>/tmp/vibe-deploy.lock
if ! flock -n 9; then
  echo "Another deploy is already running."
  exit 1
fi

cd /root/Vibe-music
SEED_CATALOG=1 SKIP_PULL=1 bash deploy/update.sh
