#!/usr/bin/env bash
# Phase 11 — final 20/20 production certification (run on VPS or dev machine).
#
# Usage:
#   VERIFY_BASE_URL=https://vibemusic.in npm run verify:production-20
#   VERIFY_BASE_URL=https://vibemusic.in bash deploy/verify-production-20.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

VERIFY_BASE_URL="${VERIFY_BASE_URL:-https://vibemusic.in}"
export VERIFY_BASE_URL

npm run verify:production-20
