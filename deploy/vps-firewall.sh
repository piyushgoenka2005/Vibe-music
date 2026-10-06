#!/usr/bin/env bash
# Configure UFW for Vibe Music production (nginx HTTP/HTTPS only).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
exec bash deploy/production.sh firewall
